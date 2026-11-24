package com.corebar.backend.api.dto;

import java.math.BigDecimal;

public record ProductoResponse(
		Integer idProducto,
		Integer idCategoria,
		String nombreCategoria,
		String nombre,
		String descripcion,
		BigDecimal precio,
		Integer stockActual,
		Integer porcentajeIva,
		String imagenUrl) {
}
