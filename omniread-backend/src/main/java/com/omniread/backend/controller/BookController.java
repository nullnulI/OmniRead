package com.omniread.backend.controller;

import com.omniread.backend.dto.ApiResponse;
import com.omniread.backend.dto.ProductRequest;
import com.omniread.backend.dto.ProductResponse;
import com.omniread.backend.service.BookService;
import java.util.List;
import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/books")
public class BookController {

    private final BookService bookService;

    @GetMapping
    public ApiResponse<List<ProductResponse>> listBooks() {
        return ApiResponse.success(bookService.listAvailableBooks());
    }

    @GetMapping("/admin")
    public ApiResponse<List<ProductResponse>> listBooksForAdmin() {
        return ApiResponse.success(bookService.listBooks());
    }

    @GetMapping("/{bookId}")
    public ApiResponse<ProductResponse> getBook(@PathVariable Long bookId) {
        return ApiResponse.success(bookService.getBook(bookId));
    }

    @PostMapping
    public ApiResponse<ProductResponse> createBook(@Valid @RequestBody ProductRequest request) {
        return ApiResponse.success(bookService.createBook(request));
    }

    @PutMapping("/{bookId}")
    public ApiResponse<ProductResponse> updateBook(
        @PathVariable Long bookId,
        @Valid @RequestBody ProductRequest request
    ) {
        return ApiResponse.success(bookService.updateBook(bookId, request));
    }
}
