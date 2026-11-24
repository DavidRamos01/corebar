package com.corebar.backend.repository;

import com.corebar.backend.entity.Factura;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FacturaRepository extends JpaRepository<Factura, Integer> {

	Optional<Factura> findByPedido_IdPedido(Integer idPedido);

	@Query("SELECT f FROM Factura f JOIN FETCH f.pedido")
	List<Factura> findAllWithPedido();

	@Query("SELECT f FROM Factura f JOIN FETCH f.pedido WHERE f.idFactura = :id")
	Optional<Factura> findByIdWithPedido(@Param("id") Integer id);

	@Query("SELECT f FROM Factura f JOIN FETCH f.pedido p WHERE p.idPedido = :idPedido")
	Optional<Factura> findByPedido_IdPedidoWithPedido(@Param("idPedido") Integer idPedido);
}
