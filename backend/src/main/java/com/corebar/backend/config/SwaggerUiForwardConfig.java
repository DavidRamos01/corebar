package com.corebar.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Springdoc suele registrar la UI sin coincidir con {@code /api/} (barra final) */
@Configuration
public class SwaggerUiForwardConfig implements WebMvcConfigurer {

	private static final String SWAGGER_PAGE = "forward:/api/swagger-ui.html";

	@Override
	public void addViewControllers(ViewControllerRegistry registry) {
		registry.addViewController("/api").setViewName(SWAGGER_PAGE);
		registry.addViewController("/api/").setViewName(SWAGGER_PAGE);
	}
}
