package com.omniread.backend.dto;

import com.omniread.backend.entity.Product;
import com.omniread.backend.entity.enums.ProductStatus;
import com.omniread.backend.entity.enums.ProductType;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private Long id;
    private String sku;
    private String isbn13;
    private String title;
    private String authorName;
    private String publisher;
    private String category;
    private String description;
    private ProductType bookType;
    private BigDecimal price;
    private String coverImageUrl;
    private ProductStatus status;

    public static ProductResponse from(Product product) {
        return ProductResponse.builder()
            .id(product.getId())
            .sku(product.getSku())
            .isbn13(product.getIsbn13())
            .title(product.getTitle())
            .authorName(product.getAuthorName())
            .publisher(product.getPublisher())
            .category(product.getCategory())
            .description(product.getDescription())
            .bookType(product.getBookType())
            .price(product.getPrice())
            .coverImageUrl(product.getCoverImageUrl())
            .status(product.getStatus())
            .build();
    }
}
