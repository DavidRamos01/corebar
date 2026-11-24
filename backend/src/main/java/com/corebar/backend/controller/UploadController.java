package com.corebar.backend.controller;

import com.corebar.backend.service.ImageStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    private final ImageStorageService imageStorageService;

    public UploadController(ImageStorageService imageStorageService) {
        this.imageStorageService = imageStorageService;
    }

    /** POST /api/upload/imagen Body: */
    @PostMapping("/imagen")
    public ResponseEntity<Map<String, String>> uploadImagen(
            @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Archivo vacío"));
        }
        String url = imageStorageService.upload(file);
        return ResponseEntity.ok(Map.of("url", url));
    }
}
