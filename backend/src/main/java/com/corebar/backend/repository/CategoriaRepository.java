package com.corebar.backend.repository;

import com.corebar.backend.entity.Categoria;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {

	Optional<Categoria> findByNombre(String nombre);

	boolean existsByNombre(String nombre);
}
