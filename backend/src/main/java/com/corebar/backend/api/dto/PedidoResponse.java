package com.corebar.backend.api.dto;

import com.corebar.backend.entity.enums.EstadoPedido;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoResponse(
		Integer idPedido,
		Integer idMesa,
		Integer numeroMesa,
		Integer idUsuario,
		String nombreUsuario,
		LocalDateTime fechaHora,
		EstadoPedido estado,
		BigDecimal total,
		Integer idFactura,
		List<DetallePedidoResponse> detalles) {
}
