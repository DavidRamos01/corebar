package com.corebar.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class ImageStorageService {

    private static final Map<String, String> ALLOWED = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif");

    private final Path uploadDir;
    private final String publicBaseUrl;

    public ImageStorageService(
            @Value("${app.upload.dir:/data/uploads}") String dir,
            @Value("${app.upload.public-base-url}") String publicBaseUrl) {
        this.uploadDir = Paths.get(dir).toAbsolutePath().normalize();
        this.publicBaseUrl = publicBaseUrl.endsWith("/")
                ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1)
                : publicBaseUrl;
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo crear el directorio de subidas: " + this.uploadDir, e);
        }
    }

    /** Guarda la imagen en disco y devuelve su URL pública. */
    public String upload(MultipartFile file) {
        String ext = ALLOWED.get(file.getContentType());
        if (file.isEmpty() || ext == null) {
            throw new IllegalArgumentException("Archivo inválido: solo se permiten imágenes JPG, PNG, WEBP o GIF");
        }
        String name = UUID.randomUUID() + ext;
        Path target = uploadDir.resolve(name).normalize();
        try {
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Error al guardar la imagen: " + e.getMessage(), e);
        }
        return publicBaseUrl + "/uploads/" + name;
    }
}
