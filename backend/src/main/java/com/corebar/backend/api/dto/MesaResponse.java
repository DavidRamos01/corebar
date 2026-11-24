package com.corebar.backend.api.dto;

import com.corebar.backend.entity.enums.EstadoMesa;
import java.math.BigDecimal;

/** idCamareroActual, id del camarero que tiene un pedido ABIERTO en esta mesa; null si la mesa está libre o no tiene ningún pedido activo */
public record MesaResponse(
		Integer idMesa,
		Integer numero,
		Integer capacidad,
		EstadoMesa estado,
		BigDecimal posX,
		BigDecimal posY,
		Integer idCamareroActual) {
}
