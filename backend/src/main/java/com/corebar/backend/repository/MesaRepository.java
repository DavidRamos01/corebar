package com.corebar.backend.repository;

import com.corebar.backend.entity.Mesa;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MesaRepository extends JpaRepository<Mesa, Integer> {

	Optional<Mesa> findByNumero(Integer numero);

	boolean existsByNumero(Integer numero);
}
