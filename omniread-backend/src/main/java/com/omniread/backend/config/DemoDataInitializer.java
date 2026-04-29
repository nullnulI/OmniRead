package com.omniread.backend.config;

import com.omniread.backend.entity.InventoryRecord;
import com.omniread.backend.entity.Product;
import com.omniread.backend.entity.User;
import com.omniread.backend.entity.enums.AccountStatus;
import com.omniread.backend.entity.enums.ProductStatus;
import com.omniread.backend.entity.enums.ProductType;
import com.omniread.backend.entity.enums.UserRole;
import com.omniread.backend.repository.InventoryRecordRepository;
import com.omniread.backend.repository.ProductRepository;
import com.omniread.backend.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(2)
@RequiredArgsConstructor
public class DemoDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final InventoryRecordRepository inventoryRecordRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${omniread.seed.demo.enabled:true}")
    private boolean demoSeedEnabled;

    @Value("${omniread.seed.demo.inventory-admin.password}")
    private String inventoryAdminPassword;

    @Value("${omniread.seed.demo.supplier.password}")
    private String supplierPassword;

    @Value("${omniread.seed.demo.customer.password}")
    private String customerPassword;

    @Override
    @Transactional
    public void run(String... args) {
        if (!demoSeedEnabled) {
            return;
        }

        seedUser("Inventory Manager", "inventory@omniread.local", inventoryAdminPassword, UserRole.INVENTORY_ADMIN, null);
        seedUser("OmniRead Supplier", "supplier@omniread.local", supplierPassword, UserRole.SUPPLIER, "OmniRead Distribution Ltd.");
        seedUser("Demo Customer", "customer@omniread.local", customerPassword, UserRole.CUSTOMER, null);

        Product architecture = seedProduct(
            "OMNI-PHY-001",
            "9780134685991",
            "Effective Java",
            "Joshua Bloch",
            "Addison-Wesley",
            "Programming",
            ProductType.PHYSICAL,
            new BigDecimal("58.00")
        );
        Product design = seedProduct(
            "OMNI-PHY-002",
            "9780201633610",
            "Design Patterns",
            "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
            "Addison-Wesley",
            "Software Engineering",
            ProductType.PHYSICAL,
            new BigDecimal("65.00")
        );
        Product ebook = seedProduct(
            "OMNI-EBK-001",
            "9781491950357",
            "Building Microservices",
            "Sam Newman",
            "O'Reilly Media",
            "Architecture",
            ProductType.EBOOK,
            new BigDecimal("39.00")
        );

        seedInventory(architecture, 8, 0, 5, 3, 7);
        seedInventory(design, 2, 0, 4, 2, 10);
        seedInventory(ebook, 0, 0, 0, 0, 0);
    }

    private void seedUser(String fullName, String email, String password, UserRole role, String supplierCompanyName) {
        if (userRepository.existsByEmail(email)) {
            return;
        }

        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setStatus(AccountStatus.ACTIVE);
        user.setSupplierCompanyName(supplierCompanyName);
        userRepository.save(user);
    }

    private Product seedProduct(
        String sku,
        String isbn13,
        String title,
        String authorName,
        String publisher,
        String category,
        ProductType productType,
        BigDecimal price
    ) {
        return productRepository.findBySku(sku)
            .orElseGet(() -> {
                Product product = new Product();
                product.setSku(sku);
                product.setIsbn13(isbn13);
                product.setTitle(title);
                product.setAuthorName(authorName);
                product.setPublisher(publisher);
                product.setCategory(category);
                product.setBookType(productType);
                product.setPrice(price);
                product.setStatus(ProductStatus.ACTIVE);
                product.setDescription("Seed data for OmniRead backend demonstration.");
                return productRepository.save(product);
            });
    }

    private void seedInventory(
        Product product,
        int quantityOnHand,
        int reservedQuantity,
        int reorderThreshold,
        int safetyStock,
        int supplierLeadTimeDays
    ) {
        if (inventoryRecordRepository.existsByProductId(product.getId())) {
            return;
        }

        InventoryRecord record = new InventoryRecord();
        record.setProduct(product);
        record.setQuantityOnHand(quantityOnHand);
        record.setReservedQuantity(reservedQuantity);
        record.setReorderThreshold(reorderThreshold);
        record.setSafetyStock(safetyStock);
        record.setSupplierLeadTimeDays(supplierLeadTimeDays);
        record.setLastRestockedAt(LocalDateTime.now());
        inventoryRecordRepository.save(record);
    }
}
