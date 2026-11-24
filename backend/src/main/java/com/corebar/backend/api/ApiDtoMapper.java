package com.corebar.backend.api;

import com.corebar.backend.api.dto.CategoriaResponse;
import com.corebar.backend.api.dto.DetallePedidoResponse;
import com.corebar.backend.api.dto.FacturaResponse;
import com.corebar.backend.api.dto.MesaResponse;
import com.corebar.backend.api.dto.PedidoResponse;
import com.corebar.backend.api.dto.ProductoResponse;
import com.corebar.backend.api.dto.UsuarioResponse;
import com.corebar.backend.entity.Categoria;
import com.corebar.backend.entity.DetallePedido;
import com.corebar.backend.entity.Factura;
import com.corebar.backend.entity.Mesa;
import com.corebar.backend.entity.Pedido;
import com.corebar.backend.entity.Producto;
import com.corebar.backend.entity.Usuario;
import java.util.List;
import java.util.stream.Collectors;

public final class ApiDtoMapper {

	private ApiDtoMapper() {
	}

	public static CategoriaResponse toResponse(Categoria c) {
		return new CategoriaResponse(c.getIdCategoria(), c.getNombre());
	}

	public static ProductoResponse toResponse(Producto p) {
		return new ProductoResponse(
				p.getIdProducto(),
				p.getCategoria().getIdCategoria(),
				p.getCategoria().getNombre(),
				p.getNombre(),
				p.getDescripcion(),
				p.getPrecio(),
				p.getStockActual(),
				p.getPorcentajeIva(),
				p.getImagenUrl());
	}

	/** Sin camarero activo (compatibilidad: PUT/POST individuales). */
	public static MesaResponse toResponse(Mesa m) {
		return toResponse(m, null);
	}

	/** Con camarero activo calculado por el llamador. */
	public static MesaResponse toResponse(Mesa m, Integer idCamareroActual) {
		return new MesaResponse(
				m.getIdMesa(),
				m.getNumero(),
				m.getCapacidad(),
				m.getEstado(),
				m.getPosX(),
				m.getPosY(),
				idCamareroActual);
	}

	public static UsuarioResponse toResponse(Usuario u) {
		return new UsuarioResponse(
				u.getIdUsuario(),
				u.getNombre(),
				u.getUsername(),
				u.getRol(),
				u.getActivo());
	}

	public static DetallePedidoResponse toResponse(DetallePedido d) {
		return new DetallePedidoResponse(
				d.getIdDetalle(),
				d.getPedido().getIdPedido(),
				d.getProducto().getIdProducto(),
				d.getProducto().getNombre(),
				d.getCantidad(),
				d.getNotas(),
				d.getPrecioUnitario(),
				d.getEstado());
	}

	public static PedidoResponse toResponse(Pedido p, boolean incluirDetalles) {
		List<DetallePedidoResponse> detalles = incluirDetalles
				? p.getDetalles().stream().map(ApiDtoMapper::toResponse).collect(Collectors.toList())
				: List.of();
		Integer idFactura = p.getFactura() != null ? p.getFactura().getIdFactura() : null;
		return new PedidoResponse(
				p.getIdPedido(),
				p.getMesa().getIdMesa(),
				p.getMesa().getNumero(),
				p.getUsuario().getIdUsuario(),
				p.getUsuario().getNombre(),
				p.getFechaHora(),
				p.getEstado(),
				p.getTotal(),
				idFactura,
				detalles);
	}

	public static FacturaResponse toResponse(Factura f) {
		return new FacturaResponse(
				f.getIdFactura(),
				f.getPedido().getIdPedido(),
				f.getFechaEmision(),
				f.getMetodoPago(),
				f.getSubtotal(),
				f.getTotalIva(),
				f.getTotal());
	}
}
