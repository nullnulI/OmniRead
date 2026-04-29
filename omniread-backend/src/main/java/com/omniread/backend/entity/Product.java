package com.omniread.backend.entity;

import com.omniread.backend.entity.enums.ProductStatus;
import com.omniread.backend.entity.enums.ProductType;
import java.math.BigDecimal;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "products")
public class Product extends BaseEntity {

    @Column(name = "sku", nullable = false, unique = true, length = 80)
    private String sku;

    @Column(name = "isbn13", unique = true, length = 20)
    private String isbn13;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "author_name", nullable = false, length = 180)
    private String authorName;

    @Column(name = "publisher", length = 180)
    private String publisher;

    @Column(name = "category", length = 120)
    private String category;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "book_type", nullable = false, length = 20)
    private ProductType bookType = ProductType.PHYSICAL;

    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private ProductStatus status = ProductStatus.ACTIVE;
}
