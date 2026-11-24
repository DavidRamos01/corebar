package com.corebar.backend.api.dto;

import com.corebar.backend.entity.enums.MetodoPago;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FacturaResponse(
		Integer idFactura,
		Integer idPedido,
		LocalDateTime fechaEmision,
		MetodoPago metodoPago,
		BigDecimal subtotal,
		BigDecimal totalIva,
		BigDecimal total) {
}
