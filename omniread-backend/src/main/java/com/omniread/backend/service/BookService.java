package com.omniread.backend.service;

import com.omniread.backend.dto.ProductRequest;
import com.omniread.backend.dto.ProductResponse;
import java.util.List;

public interface BookService {

    List<ProductResponse> listAvailableBooks();

    List<ProductResponse> listBooks();

    ProductResponse getBook(Long id);

    ProductResponse createBook(ProductRequest request);

    ProductResponse updateBook(Long id, ProductRequest request);
}
