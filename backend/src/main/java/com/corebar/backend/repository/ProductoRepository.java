package com.corebar.backend.repository;

import com.corebar.backend.entity.Producto;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductoRepository extends JpaRepository<Producto, Integer> {

	@Query("SELECT p FROM Producto p JOIN FETCH p.categoria")
	List<Producto> findAllWithCategoria();

	@Query("SELECT p FROM Producto p JOIN FETCH p.categoria WHERE p.idProducto = :id")
	Optional<Producto> findByIdWithCategoria(@Param("id") Integer id);

	List<Producto> findByCategoria_IdCategoria(Integer idCategoria);

	@Query("SELECT p FROM Producto p JOIN FETCH p.categoria c WHERE c.idCategoria = :idCategoria")
	List<Producto> findByCategoria_IdCategoriaWithCategoria(@Param("idCategoria") Integer idCategoria);
}
