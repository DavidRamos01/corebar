package com.corebar.backend.controller;

import com.corebar.backend.api.ApiDtoMapper;
import com.corebar.backend.api.dto.CategoriaRequest;
import com.corebar.backend.api.dto.CategoriaResponse;
import com.corebar.backend.api.error.ResourceNotFoundException;
import com.corebar.backend.entity.Categoria;
import com.corebar.backend.repository.CategoriaRepository;
import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

	private final CategoriaRepository categorias;

	public CategoriaController(CategoriaRepository categorias) {
		this.categorias = categorias;
	}

	@GetMapping
	public List<CategoriaResponse> listar() {
		return categorias.findAll().stream().map(ApiDtoMapper::toResponse).collect(Collectors.toList());
	}

	@GetMapping("/{id}")
	public CategoriaResponse obtener(@PathVariable Integer id) {
		Categoria c = categorias.findById(id).orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada: " + id));
		return ApiDtoMapper.toResponse(c);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public CategoriaResponse crear(@Valid @RequestBody CategoriaRequest request) {
		if (categorias.existsByNombre(request.nombre())) {
			throw new IllegalStateException("Ya existe una categoría con ese nombre");
		}
		Categoria c = new Categoria();
		c.setNombre(request.nombre());
		return ApiDtoMapper.toResponse(categorias.save(c));
	}

	@PutMapping("/{id}")
	public CategoriaResponse actualizar(@PathVariable Integer id, @Valid @RequestBody CategoriaRequest request) {
		Categoria c = categorias.findById(id).orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada: " + id));
		categorias.findByNombre(request.nombre()).ifPresent(other -> {
			if (!other.getIdCategoria().equals(id)) {
				throw new IllegalStateException("Ya existe otra categoría con ese nombre");
			}
		});
		c.setNombre(request.nombre());
		return ApiDtoMapper.toResponse(categorias.save(c));
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void eliminar(@PathVariable Integer id) {
		if (!categorias.existsById(id)) {
			throw new ResourceNotFoundException("Categoría no encontrada: " + id);
		}
		categorias.deleteById(id);
	}
}
