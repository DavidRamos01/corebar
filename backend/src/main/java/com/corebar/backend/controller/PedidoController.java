package com.corebar.backend.controller;

import com.corebar.backend.api.ApiDtoMapper;
import com.corebar.backend.api.dto.DetalleEstadoRequest;
import com.corebar.backend.api.dto.DetallePedidoRequest;
import com.corebar.backend.api.dto.DetallePedidoResponse;
import com.corebar.backend.api.dto.PedidoCreateRequest;
import com.corebar.backend.api.dto.PedidoEstadoRequest;
import com.corebar.backend.api.dto.PedidoResponse;
import com.corebar.backend.api.error.ResourceNotFoundException;
import com.corebar.backend.entity.DetallePedido;
import com.corebar.backend.entity.Mesa;
import com.corebar.backend.entity.Pedido;
import com.corebar.backend.entity.Producto;
import com.corebar.backend.entity.Usuario;
import com.corebar.backend.entity.enums.EstadoMesa;
import com.corebar.backend.entity.enums.EstadoPedido;
import com.corebar.backend.repository.DetallePedidoRepository;
import com.corebar.backend.repository.MesaRepository;
import com.corebar.backend.repository.PedidoRepository;
import com.corebar.backend.repository.ProductoRepository;
import com.corebar.backend.repository.UsuarioRepository;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

	private final PedidoRepository pedidos;
	private final DetallePedidoRepository detalles;
	private final MesaRepository mesas;
	private final UsuarioRepository usuarios;
	private final ProductoRepository productos;

	public PedidoController(
			PedidoRepository pedidos,
			DetallePedidoRepository detalles,
			MesaRepository mesas,
			UsuarioRepository usuarios,
			ProductoRepository productos) {
		this.pedidos = pedidos;
		this.detalles = detalles;
		this.mesas = mesas;
		this.usuarios = usuarios;
		this.productos = productos;
	}

	@GetMapping
	public List<PedidoResponse> listar(
			@RequestParam(required = false) Integer mesaId,
			@RequestParam(required = false) EstadoPedido estado) {
		List<Pedido> lista;
		if (mesaId != null && estado != null) {
			lista = pedidos.findByMesa_IdMesaAndEstado(mesaId, estado);
		} else if (mesaId != null) {
			lista = pedidos.findByMesa_IdMesa(mesaId);
		} else if (estado != null) {
			lista = pedidos.findByEstado(estado);
		} else {
			lista = pedidos.findAll();
		}
		return lista.stream().map(p -> ApiDtoMapper.toResponse(p, false)).collect(Collectors.toList());
	}

	@GetMapping("/mesa/{idMesa}/abierto")
	public PedidoResponse pedidoAbiertoPorMesa(@PathVariable Integer idMesa) {
		Pedido p = pedidos
				.findFirstByMesa_IdMesaAndEstadoOrderByIdPedidoDesc(idMesa, EstadoPedido.ABIERTO)
				.orElseThrow(() -> new ResourceNotFoundException("No hay pedido abierto para la mesa " + idMesa));
		return pedidos.findById(p.getIdPedido()).map(x -> ApiDtoMapper.toResponse(x, true)).orElseThrow();
	}

	@GetMapping("/{id}")
	public PedidoResponse obtener(@PathVariable Integer id) {
		Pedido p = pedidos.findById(id).orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado: " + id));
		return ApiDtoMapper.toResponse(p, true);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@Transactional
	public PedidoResponse crear(@Valid @RequestBody PedidoCreateRequest request) {
		pedidos
				.findFirstByMesa_IdMesaAndEstadoOrderByIdPedidoDesc(request.idMesa(), EstadoPedido.ABIERTO)
				.ifPresent(p -> {
					throw new IllegalStateException(
							"La mesa ya tiene un pedido abierto (id " + p.getIdPedido() + ")");
				});
		Mesa mesa = mesas.findById(request.idMesa()).orElseThrow(() -> new ResourceNotFoundException("Mesa no encontrada: " + request.idMesa()));
		Usuario usuario = usuarios
				.findById(request.idUsuario())
				.orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + request.idUsuario()));
		Pedido pedido = new Pedido();
		pedido.setMesa(mesa);
		pedido.setUsuario(usuario);
		pedido.setEstado(EstadoPedido.ABIERTO);
		pedido.setTotal(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
		Pedido guardado = pedidos.save(pedido);
		mesa.setEstado(EstadoMesa.OCUPADA);
		mesas.save(mesa);
		return pedidos.findById(guardado.getIdPedido()).map(p -> ApiDtoMapper.toResponse(p, true)).orElseThrow();
	}

	@PatchMapping("/{id}/estado")
	@Transactional
	public PedidoResponse cambiarEstadoPedido(@PathVariable Integer id, @Valid @RequestBody PedidoEstadoRequest request) {
		Pedido p = pedidos.findById(id).orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado: " + id));
		p.setEstado(request.estado());
		Pedido guardado = pedidos.save(p);
		return pedidos.findById(guardado.getIdPedido()).map(x -> ApiDtoMapper.toResponse(x, true)).orElseThrow();
	}

	@PostMapping("/{id}/detalles")
	@ResponseStatus(HttpStatus.CREATED)
	@Transactional
	public DetallePedidoResponse agregarLinea(@PathVariable Integer id, @Valid @RequestBody DetallePedidoRequest request) {
		Pedido pedido = pedidos.findById(id).orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado: " + id));
		if (pedido.getEstado() != EstadoPedido.ABIERTO) {
			throw new IllegalStateException("Solo se pueden añadir líneas a pedidos en estado ABIERTO");
		}
		Producto producto = productos
				.findById(request.idProducto())
				.orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + request.idProducto()));
		BigDecimal unit = request.precioUnitario() != null ? request.precioUnitario() : producto.getPrecio();
		DetallePedido linea = new DetallePedido();
		linea.setPedido(pedido);
		linea.setProducto(producto);
		linea.setCantidad(request.cantidad());
		linea.setNotas(request.notas());
		linea.setPrecioUnitario(unit.setScale(2, RoundingMode.HALF_UP));
		pedido.getDetalles().add(linea);
		recalcularTotal(pedido);
		pedidos.save(pedido);
		// Descontar stock del producto
		int stockActual = producto.getStockActual() != null ? producto.getStockActual() : 0;
		producto.setStockActual(Math.max(0, stockActual - request.cantidad()));
		productos.save(producto);
		return ApiDtoMapper.toResponse(linea);
	}

	@PatchMapping("/{idPedido}/detalles/{idDetalle}/estado")
	@Transactional
	public DetallePedidoResponse cambiarEstadoLinea(
			@PathVariable Integer idPedido,
			@PathVariable Integer idDetalle,
			@Valid @RequestBody DetalleEstadoRequest request) {
		DetallePedido d = detalles.findById(idDetalle).orElseThrow(() -> new ResourceNotFoundException("Línea no encontrada: " + idDetalle));
		if (!d.getPedido().getIdPedido().equals(idPedido)) {
			throw new IllegalArgumentException("La línea no pertenece a ese pedido");
		}
		d.setEstado(request.estado());
		return ApiDtoMapper.toResponse(detalles.save(d));
	}

	@DeleteMapping("/{idPedido}/detalles/{idDetalle}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Transactional
	public void eliminarLinea(@PathVariable Integer idPedido, @PathVariable Integer idDetalle) {
		Pedido pedido = pedidos.findById(idPedido).orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado: " + idPedido));
		if (pedido.getEstado() != EstadoPedido.ABIERTO) {
			throw new IllegalStateException("Solo se pueden borrar líneas de pedidos ABIERTOS");
		}
		DetallePedido d = detalles.findById(idDetalle).orElseThrow(() -> new ResourceNotFoundException("Línea no encontrada: " + idDetalle));
		if (!d.getPedido().getIdPedido().equals(idPedido)) {
			throw new IllegalArgumentException("La línea no pertenece a ese pedido");
		}
		// Devolver el stock al producto antes de eliminar la línea
		Producto producto = d.getProducto();
		int stockActual = producto.getStockActual() != null ? producto.getStockActual() : 0;
		producto.setStockActual(stockActual + d.getCantidad());
		productos.save(producto);
		pedido.getDetalles().remove(d);
		recalcularTotal(pedido);
		pedidos.save(pedido);
	}

	@GetMapping("/camarero/{usuarioId}/abiertos")
	public List<PedidoResponse> pedidosAbiertosDeUsuario(@PathVariable Integer usuarioId) {
		return pedidos.findByUsuario_IdUsuarioAndEstado(usuarioId, EstadoPedido.ABIERTO)
				.stream()
				.map(p -> pedidos.findById(p.getIdPedido())
						.map(full -> ApiDtoMapper.toResponse(full, true))
						.orElse(ApiDtoMapper.toResponse(p, false)))
				.collect(Collectors.toList());
	}

	private static void recalcularTotal(Pedido pedido) {
		BigDecimal sum = pedido.getDetalles().stream()
				.map(det -> det.getPrecioUnitario().multiply(BigDecimal.valueOf(det.getCantidad())))
				.reduce(BigDecimal.ZERO, BigDecimal::add);
		pedido.setTotal(sum.setScale(2, RoundingMode.HALF_UP));
	}
}
