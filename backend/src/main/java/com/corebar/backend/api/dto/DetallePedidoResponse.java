package com.corebar.backend.api.dto;

import com.corebar.backend.entity.enums.EstadoDetallePedido;
import java.math.BigDecimal;

public record DetallePedidoResponse(
		Integer idDetalle,
		Integer idPedido,
		Integer idProducto,
		String nombreProducto,
		Integer cantidad,
		String notas,
		BigDecimal precioUnitario,
		EstadoDetallePedido estado) {
}
