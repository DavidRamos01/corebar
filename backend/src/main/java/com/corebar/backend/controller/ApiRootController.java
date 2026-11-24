package com.corebar.backend.controller;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/info")
public class ApiRootController {

	@GetMapping({"", "/"})
	public Map<String, Object> info() {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("name", "CoreBar API");
		body.put("message", "La documentación interactiva está en /api. Este JSON es solo referencia.");
		body.put("openapi", "/api/openapi");
		body.put("swaggerUi", "/api");
		body.put("endpoints", Map.of(
				"categorias", "/api/categorias",
				"productos", "/api/productos",
				"mesas", "/api/mesas",
				"usuarios", "/api/usuarios",
				"pedidos", "/api/pedidos",
				"facturas", "/api/facturas"));
		return body;
	}
}
