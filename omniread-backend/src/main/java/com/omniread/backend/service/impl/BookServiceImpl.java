package com.omniread.backend.service.impl;

import com.omniread.backend.dto.ProductRequest;
import com.omniread.backend.dto.ProductResponse;
import com.omniread.backend.entity.Product;
import com.omniread.backend.entity.enums.ProductStatus;
import com.omniread.backend.repository.ProductRepository;
import com.omniread.backend.service.BookService;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.omniread.backend.config.RedisConfig.BOOKS_CACHE;

@Service
@RequiredArgsConstructor
public class BookServiceImpl implements BookService {

    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = BOOKS_CACHE, key = "'available'")
    public List<ProductResponse> listAvailableBooks() {
        return productRepository.findByStatus(ProductStatus.ACTIVE)
            .stream()
            .map(ProductResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = BOOKS_CACHE, key = "'admin'")
    public List<ProductResponse> listBooks() {
        return productRepository.findAll()
            .stream()
            .map(ProductResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = BOOKS_CACHE, key = "'book:' + #p0")
    public ProductResponse getBook(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Book not found: " + id));
        return ProductResponse.from(product);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = BOOKS_CACHE, allEntries = true)
    public ProductResponse createBook(ProductRequest request) {
        Product product = new Product();
        applyProductRequest(product, request);
        return ProductResponse.from(productRepository.save(product));
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = BOOKS_CACHE, allEntries = true)
    public ProductResponse updateBook(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Book not found: " + id));
        applyProductRequest(product, request);
        return ProductResponse.from(productRepository.save(product));
    }

    private void applyProductRequest(Product product, ProductRequest request) {
        product.setSku(request.getSku());
        product.setIsbn13(request.getIsbn13());
        product.setTitle(request.getTitle());
        product.setAuthorName(request.getAuthorName());
        product.setPublisher(request.getPublisher());
        product.setCategory(request.getCategory());
        product.setDescription(request.getDescription());
        product.setBookType(request.getBookType());
        product.setPrice(request.getPrice());
        product.setCoverImageUrl(request.getCoverImageUrl());
        product.setStatus(request.getStatus());
    }
}
