package com.omniread.backend.dto;

import com.omniread.backend.entity.enums.ProductStatus;
import com.omniread.backend.entity.enums.ProductType;
import java.math.BigDecimal;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductRequest {

    @NotBlank
    private String sku;

    private String isbn13;

    @NotBlank
    private String title;

    @NotBlank
    private String authorName;

    private String publisher;
    private String category;
    private String description;
    private ProductType bookType = ProductType.PHYSICAL;

    @NotNull
    @DecimalMin("0.00")
    private BigDecimal price;

    private String coverImageUrl;
    private ProductStatus status = ProductStatus.ACTIVE;
}
