package com.corebar.backend.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ProductoRequest(
		@NotNull Integer idCategoria,
		@NotBlank @Size(max = 150) String nombre,
		String descripcion,
		@NotNull BigDecimal precio,
		@PositiveOrZero Integer stockActual,
		Integer porcentajeIva,
		String imagenUrl) {
}
