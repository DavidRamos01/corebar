package com.corebar.backend.controller;

import com.corebar.backend.api.ApiDtoMapper;
import com.corebar.backend.api.dto.ProductoRequest;
import com.corebar.backend.api.dto.ProductoResponse;
import com.corebar.backend.api.error.ResourceNotFoundException;
import com.corebar.backend.entity.Categoria;
import com.corebar.backend.entity.Producto;
import com.corebar.backend.repository.CategoriaRepository;
import com.corebar.backend.repository.ProductoRepository;
import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

	private final ProductoRepository productos;
	private final CategoriaRepository categorias;

	public ProductoController(ProductoRepository productos, CategoriaRepository categorias) {
		this.productos = productos;
		this.categorias = categorias;
	}

	@GetMapping
	public List<ProductoResponse> listar(@RequestParam(required = false) Integer categoriaId) {
		List<Producto> lista = categoriaId == null
				? productos.findAllWithCategoria()
				: productos.findByCategoria_IdCategoriaWithCategoria(categoriaId);
		return lista.stream().map(ApiDtoMapper::toResponse).collect(Collectors.toList());
	}

	@GetMapping("/{id}")
	public ProductoResponse obtener(@PathVariable Integer id) {
		Producto p = productos.findByIdWithCategoria(id).orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + id));
		return ApiDtoMapper.toResponse(p);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ProductoResponse crear(@Valid @RequestBody ProductoRequest request) {
		Categoria cat = categorias.findById(request.idCategoria()).orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada: " + request.idCategoria()));
		Producto p = new Producto();
		p.setCategoria(cat);
		aplicar(p, request);
		return ApiDtoMapper.toResponse(productos.save(p));
	}

	@PutMapping("/{id}")
	public ProductoResponse actualizar(@PathVariable Integer id, @Valid @RequestBody ProductoRequest request) {
		Producto p = productos.findById(id).orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + id));
		Categoria cat = categorias.findById(request.idCategoria()).orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada: " + request.idCategoria()));
		p.setCategoria(cat);
		aplicar(p, request);
		Producto guardado = productos.save(p);
		return ApiDtoMapper.toResponse(productos.findByIdWithCategoria(guardado.getIdProducto()).orElse(guardado));
	}

	/** Marca un producto como agotado (stockActual = 0) */
	@PatchMapping("/{id}/agotado")
	@Transactional
	public ResponseEntity<Map<String, Object>> marcarAgotado(@PathVariable Integer id) {
		Producto p = productos.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + id));
		int previousStock = p.getStockActual() != null ? p.getStockActual() : 0;
		p.setStockActual(0);
		productos.save(p);
		Map<String, Object> resp = new HashMap<>();
		resp.put("idProducto", id);
		resp.put("previousStock", previousStock);
		resp.put("stockActual", 0);
		return ResponseEntity.ok(resp);
	}

	/** Actualiza el stock de un producto a un valor concreto */
	@PatchMapping("/{id}/stock")
	@Transactional
	public ResponseEntity<ProductoResponse> actualizarStock(
			@PathVariable Integer id,
			@RequestBody Map<String, Integer> body) {
		Producto p = productos.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + id));
		int nuevoStock = body.getOrDefault("stockActual", 0);
		p.setStockActual(Math.max(0, nuevoStock));
		Producto guardado = productos.save(p);
		return ResponseEntity.ok(ApiDtoMapper.toResponse(
				productos.findByIdWithCategoria(guardado.getIdProducto()).orElse(guardado)));
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void eliminar(@PathVariable Integer id) {
		if (!productos.existsById(id)) {
			throw new ResourceNotFoundException("Producto no encontrado: " + id);
		}
		productos.deleteById(id);
	}

	private static void aplicar(Producto p, ProductoRequest request) {
		p.setNombre(request.nombre());
		p.setDescripcion(request.descripcion());
		p.setPrecio(request.precio());
		p.setStockActual(request.stockActual() != null ? request.stockActual() : 0);
		p.setPorcentajeIva(request.porcentajeIva() != null ? request.porcentajeIva() : 21);
		p.setImagenUrl(request.imagenUrl());
	}
}
