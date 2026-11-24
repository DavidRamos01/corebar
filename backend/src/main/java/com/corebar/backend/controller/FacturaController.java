package com.corebar.backend.controller;

import com.corebar.backend.api.ApiDtoMapper;
import com.corebar.backend.api.dto.FacturaCreateRequest;
import com.corebar.backend.api.dto.FacturaResponse;
import com.corebar.backend.api.error.ResourceNotFoundException;
import com.corebar.backend.entity.DetallePedido;
import com.corebar.backend.entity.Factura;
import com.corebar.backend.entity.Mesa;
import com.corebar.backend.entity.Pedido;
import com.corebar.backend.entity.enums.EstadoMesa;
import com.corebar.backend.entity.enums.EstadoPedido;
import com.corebar.backend.repository.FacturaRepository;
import com.corebar.backend.repository.MesaRepository;
import com.corebar.backend.repository.PedidoRepository;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/facturas")
public class FacturaController {

	private final FacturaRepository facturas;
	private final PedidoRepository pedidos;
	private final MesaRepository mesas;

	public FacturaController(FacturaRepository facturas, PedidoRepository pedidos, MesaRepository mesas) {
		this.facturas = facturas;
		this.pedidos  = pedidos;
		this.mesas    = mesas;
	}

	@GetMapping
	public List<FacturaResponse> listar() {
		return facturas.findAllWithPedido().stream()
				.map(ApiDtoMapper::toResponse)
				.collect(Collectors.toList());
	}

	@GetMapping("/{id}")
	public FacturaResponse obtener(@PathVariable Integer id) {
		Factura f = facturas.findByIdWithPedido(id)
				.orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada: " + id));
		return ApiDtoMapper.toResponse(f);
	}

	@GetMapping("/pedido/{idPedido}")
	public FacturaResponse porPedido(@PathVariable Integer idPedido) {
		Factura f = facturas.findByPedido_IdPedidoWithPedido(idPedido)
				.orElseThrow(() -> new ResourceNotFoundException("No hay factura para el pedido " + idPedido));
		return ApiDtoMapper.toResponse(f);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@Transactional
	public FacturaResponse crear(@Valid @RequestBody FacturaCreateRequest request) {
		// Validaciones previas
		Pedido pedido = pedidos.findById(request.idPedido())
				.orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado: " + request.idPedido()));

		if (pedido.getEstado() != EstadoPedido.ABIERTO) {
			throw new IllegalStateException("Solo se puede facturar un pedido en estado ABIERTO");
		}
		if (facturas.findByPedido_IdPedido(request.idPedido()).isPresent()) {
			throw new IllegalStateException("Este pedido ya tiene factura");
		}

		// Cálculo de importes (el precio unitario almacenado ya incluye IVA)
		BigDecimal subtotal  = BigDecimal.ZERO;
		BigDecimal totalIva  = BigDecimal.ZERO;

		for (DetallePedido det : pedido.getDetalles()) {
			int ivaPct = (det.getProducto().getPorcentajeIva() != null)
					? det.getProducto().getPorcentajeIva() : 21;

			BigDecimal lineaTotal = det.getPrecioUnitario()
					.multiply(BigDecimal.valueOf(det.getCantidad()));

			// base sin IVA = total_línea / (1 + iva/100)
			BigDecimal divisor = BigDecimal.ONE.add(
					BigDecimal.valueOf(ivaPct).divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
			BigDecimal lineaBase = lineaTotal.divide(divisor, 2, RoundingMode.HALF_UP);

			subtotal = subtotal.add(lineaBase);
			totalIva = totalIva.add(lineaTotal.subtract(lineaBase));
		}

		BigDecimal total = pedido.getTotal();
		// Ajuste de redondeo: el total que cuenta es el del pedido
		totalIva = total.subtract(subtotal).setScale(2, RoundingMode.HALF_UP);

		// Persistir
		Factura f = new Factura();
		f.setPedido(pedido);
		f.setMetodoPago(request.metodoPago());
		f.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
		f.setTotalIva(totalIva);
		f.setTotal(total.setScale(2, RoundingMode.HALF_UP));
		facturas.save(f);

		pedido.setEstado(EstadoPedido.PAGADO);
		pedidos.save(pedido);

		Mesa mesa = pedido.getMesa();
		mesa.setEstado(EstadoMesa.LIBRE);
		mesas.save(mesa);

		return ApiDtoMapper.toResponse(f);
	}
}
