package com.corebar.backend.controller;

import com.corebar.backend.api.ApiDtoMapper;
import com.corebar.backend.api.dto.MesaEstadoRequest;
import com.corebar.backend.api.dto.MesaRequest;
import com.corebar.backend.api.dto.MesaResponse;
import com.corebar.backend.api.error.ResourceNotFoundException;
import com.corebar.backend.entity.Mesa;
import com.corebar.backend.entity.enums.EstadoMesa;
import com.corebar.backend.entity.enums.EstadoPedido;
import com.corebar.backend.repository.MesaRepository;
import com.corebar.backend.repository.PedidoRepository;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mesas")
public class MesaController {

	private final MesaRepository mesas;
	private final PedidoRepository pedidos;

	public MesaController(MesaRepository mesas, PedidoRepository pedidos) {
		this.mesas   = mesas;
		this.pedidos = pedidos;
	}

	@GetMapping
	public List<MesaResponse> listar() {
		// Una sola query para todos los pedidos ABIERTO -> mapa idMesa -> idCamarero
		Map<Integer, Integer> camareroPorMesa = pedidos.findByEstado(EstadoPedido.ABIERTO)
				.stream()
				.collect(Collectors.toMap(
						p -> p.getMesa().getIdMesa(),
						p -> p.getUsuario().getIdUsuario(),
						(a, b) -> a   // si hubiera duplicado (no debería), conserva el primero
				));
		return mesas.findAll().stream()
				.map(m -> ApiDtoMapper.toResponse(m, camareroPorMesa.get(m.getIdMesa())))
				.collect(Collectors.toList());
	}

	@GetMapping("/{id}")
	public MesaResponse obtener(@PathVariable Integer id) {
		Mesa m = mesas.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Mesa no encontrada: " + id));
		Integer idCamarero = pedidos
				.findFirstByMesa_IdMesaAndEstadoOrderByIdPedidoDesc(id, EstadoPedido.ABIERTO)
				.map(p -> p.getUsuario().getIdUsuario())
				.orElse(null);
		return ApiDtoMapper.toResponse(m, idCamarero);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public MesaResponse crear(@Valid @RequestBody MesaRequest request) {
		if (mesas.existsByNumero(request.numero())) {
			throw new IllegalStateException("Ya existe una mesa con el número " + request.numero());
		}
		Mesa m = new Mesa();
		aplicar(m, request);
		return ApiDtoMapper.toResponse(mesas.save(m));
	}

	@PutMapping("/{id}")
	public MesaResponse actualizar(@PathVariable Integer id, @Valid @RequestBody MesaRequest request) {
		Mesa m = mesas.findById(id).orElseThrow(() -> new ResourceNotFoundException("Mesa no encontrada: " + id));
		mesas.findByNumero(request.numero()).ifPresent(other -> {
			if (!other.getIdMesa().equals(id)) {
				throw new IllegalStateException("Ya existe otra mesa con el número " + request.numero());
			}
		});
		aplicar(m, request);
		return ApiDtoMapper.toResponse(mesas.save(m));
	}

	@PatchMapping("/{id}/estado")
	public MesaResponse cambiarEstado(@PathVariable Integer id, @Valid @RequestBody MesaEstadoRequest request) {
		Mesa m = mesas.findById(id).orElseThrow(() -> new ResourceNotFoundException("Mesa no encontrada: " + id));
		m.setEstado(request.estado());
		return ApiDtoMapper.toResponse(mesas.save(m));
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void eliminar(@PathVariable Integer id) {
		if (!mesas.existsById(id)) {
			throw new ResourceNotFoundException("Mesa no encontrada: " + id);
		}
		mesas.deleteById(id);
	}

	private static void aplicar(Mesa m, MesaRequest request) {
		m.setNumero(request.numero());
		m.setCapacidad(request.capacidad());
		m.setEstado(request.estado() != null ? request.estado() : EstadoMesa.LIBRE);
		BigDecimal px = request.posX() != null ? request.posX() : BigDecimal.ZERO.setScale(2);
		BigDecimal py = request.posY() != null ? request.posY() : BigDecimal.ZERO.setScale(2);
		m.setPosX(px);
		m.setPosY(py);
	}
}
