package com.corebar.backend.config;

import com.corebar.backend.entity.Categoria;
import com.corebar.backend.entity.Producto;
import com.corebar.backend.entity.Usuario;
import com.corebar.backend.entity.enums.Rol;
import com.corebar.backend.repository.CategoriaRepository;
import com.corebar.backend.repository.ProductoRepository;
import com.corebar.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // Siempre corregir nombres existentes (tildes y ñ)
        fixSpanish();

        // Crear usuario admin por defecto si no existe ya
        if (!usuarioRepository.existsByUsername("admin")) {
            Usuario admin = new Usuario();
            admin.setNombre("Administrador");
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode(System.getenv("ADMIN_INITIAL_PASSWORD")));
            admin.setRol(Rol.ADMIN);
            admin.setActivo(true);
            usuarioRepository.save(admin);
            log.info("[DataInitializer] Usuario admin creado (username: admin)");
        }

        // Carga inicial solo si la BD está vacía
        if (categoriaRepository.count() > 0) {
            log.info("[DataInitializer] Catálogo ya existente, se omite la carga inicial.");
            return;
        }
        log.info("[DataInitializer] Cargando catálogo inicial...");
        seedCatalogo();
        log.info("[DataInitializer] Catálogo cargado: {} categorías, {} productos.",
                categoriaRepository.count(), productoRepository.count());
    }

    // CORRECCIÓN DE TILDES Y Ñ EN REGISTROS EXISTENTES

    /** Corrige nombres de categorías y productos que puedan estar sin tildes ni ñ. */
    private void fixSpanish() {
        int catFixed  = fixCategorias();
        int prodFixed = fixProductos();
        if (catFixed + prodFixed > 0) {
            log.info("[DataInitializer] Corrección ortográfica: {} categoría(s) y {} producto(s) actualizados.",
                    catFixed, prodFixed);
        }
    }

    private int fixCategorias() {
        int count = 0;
        // mapa: nombre antiguo -> nombre correcto
        Map<String, String> fixes = Map.of(
            "Cocteles de Autor", "Cócteles de Autor"
        );
        for (Map.Entry<String, String> e : fixes.entrySet()) {
            Optional<Categoria> opt = categoriaRepository.findByNombre(e.getKey());
            if (opt.isPresent()) {
                Categoria c = opt.get();
                c.setNombre(e.getValue());
                categoriaRepository.save(c);
                count++;
            }
        }
        return count;
    }

    private int fixProductos() {
        int count = 0;

        // Nombre del producto -> nombre correcto
        Map<String, String> namesFix = Map.ofEntries(
            // Entrantes
            Map.entry("Jamon Iberico de Bellota D.O.",               "Jamón Ibérico de Bellota D.O."),
            Map.entry("Croquetas de Cocido Madrileno (8 uds)",        "Croquetas de Cocido Madrileño (8 uds)"),
            Map.entry("Ostras Finas de Bretana (6 uds)",              "Ostras Finas de Bretaña (6 uds)"),
            Map.entry("Tartar de Atun Rojo con Aguacate",             "Tartar de Atún Rojo con Aguacate"),
            Map.entry("Zamburinas a la Gallega",                      "Zamburiñas a la Gallega"),
            // Sopas
            Map.entry("Consome de Ave con Ravioli de Tuetano",        "Consomé de Ave con Ravioli de Tuétano"),
            // Ensaladas
            Map.entry("Mezclum con Anchoas del Cantabrico",           "Mezclum con Anchoas del Cantábrico"),
            // Pescados
            Map.entry("Langostinos de Sanlucar a la Plancha (6 uds)", "Langostinos de Sanlúcar a la Plancha (6 uds)"),
            // Carnes
            Map.entry("Pichon de Bresse",                             "Pichón de Bresse"),
            Map.entry("Carrillera de Iberico Estofada",               "Carrillera de Ibérico Estofada"),
            Map.entry("Cocido Madrileno Completo (para 2)",           "Cocido Madrileño Completo (para 2)"),
            // Arroces
            Map.entry("Fideua de Mariscos",                           "Fideuá de Mariscos"),
            // Postres
            Map.entry("Souffle de Chocolate Valrhona",                "Soufflé de Chocolate Valrhona"),
            // Vinos
            Map.entry("Vega Sicilia Unico (copa)",                    "Vega Sicilia Único (copa)"),
            Map.entry("Marques de Riscal Gran Reserva (copa)",        "Marqués de Riscal Gran Reserva (copa)"),
            Map.entry("Albarino Pazo de Senorans (copa)",             "Albariño Pazo de Señoráns (copa)"),
            Map.entry("Cava Gramona III Lustros (copa)",              "Cava Gramona III Lustros (copa)"),   // sin cambio, incluido por completitud
            // Cócteles
            Map.entry("Old Fashioned Japones",                        "Old Fashioned Japonés"),
            Map.entry("Virgin Sangria de Temporada",                  "Virgin Sangría de Temporada"),
            // Bebidas
            Map.entry("Cafe Espresso",                                "Café Espresso"),
            Map.entry("Cafe Cortado",                                 "Café Cortado"),
            Map.entry("Te o Infusion Seleccion",                      "Té o Infusión Selección")
        );

        // Descripción del producto -> descripción correcta
        Map<String, String> descFix = Map.ofEntries(
            // Entrantes
            Map.entry("Jamon de pata negra 100% iberico de bellota, cortado a cuchillo",
                      "Jamón de pata negra 100% ibérico de bellota, cortado a cuchillo"),
            Map.entry("Croquetas cremosas de cocido madrileno tradicional, bechamel de tuetano",
                      "Croquetas cremosas de cocido madrileño tradicional, bechamel de tuétano"),
            Map.entry("Con granizado de limon y vinagreta de chalota",
                      "Con granizado de limón y vinagreta de chalota"),
            Map.entry("Atun rojo de almadraba, aguacate, soja ponzu y sesamo tostado",
                      "Atún rojo de almadraba, aguacate, soja ponzu y sésamo tostado"),
            Map.entry("Con reduccion de Pedro Ximenez y mango caramelizado",
                      "Con reducción de Pedro Ximénez y mango caramelizado"),
            Map.entry("A la plancha con aceite de oliva virgen extra y pimenton de la Vera",
                      "A la plancha con aceite de oliva virgen extra y pimentón de la Vera"),
            // Sopas
            Map.entry("Con virutas de jamon iberico y aceite de oliva virgen extra",
                      "Con virutas de jamón ibérico y aceite de oliva virgen extra"),
            Map.entry("Con aceite de trufa negra y crujiente de pan de castana",
                      "Con aceite de trufa negra y crujiente de pan de castaña"),
            Map.entry("Caldo de ave concentrado y ravioli casero relleno de tuetano y hierbas",
                      "Caldo de ave concentrado y ravioli casero relleno de tuétano y hierbas"),
            Map.entry("Receta tradicional madrilena con huevo escalfado y pan tostado",
                      "Receta tradicional madrileña con huevo escalfado y pan tostado"),
            // Ensaladas
            Map.entry("Burrata fresca, tomate Kumato, albahaca y pesto de pinones",
                      "Burrata fresca, tomate Kumato, albahaca y pesto de piñones"),
            Map.entry("Con esparragos blancos de Navarra y vinagreta de citricos",
                      "Con espárragos blancos de Navarra y vinagreta de cítricos"),
            Map.entry("Lechugas de temporada, anchoas premium y vinagreta de Modena",
                      "Lechugas de temporada, anchoas premium y vinagreta de Módena"),
            // Pescados
            Map.entry("Con patatas panadera y salsa de azafran",
                      "Con patatas panadera y salsa de azafrán"),
            Map.entry("Con pimenton de la Vera, aceite de oliva y patata cocida",
                      "Con pimentón de la Vera, aceite de oliva y patata cocida"),
            Map.entry("Bacalao de Islandia con pil-pil clasico y pimiento del piquillo confitado",
                      "Bacalao de Islandia con pil-pil clásico y pimiento del piquillo confitado"),
            // Carnes
            Map.entry("Al horno de lena, con ensalada verde y dulce de membrillo",
                      "Al horno de leña, con ensalada verde y dulce de membrillo"),
            Map.entry("Con escalopa de foie gras, laminas de trufa negra y reduccion de Oporto",
                      "Con escalopa de foie gras, láminas de trufa negra y reducción de Oporto"),
            Map.entry("Asado en horno de lena con jugo de asado y hierbas aromaticas",
                      "Asado en horno de leña con jugo de asado y hierbas aromáticas"),
            Map.entry("Con pure trufado y jugo de asado al vino tinto",
                      "Con puré trufado y jugo de asado al vino tinto"),
            Map.entry("Estofada en vino tinto Ribera del Duero con pure de apionabo",
                      "Estofada en vino tinto Ribera del Duero con puré de apionabo"),
            // Arroces
            Map.entry("Con laminas de boletus frescos y parmesano reggiano 36 meses",
                      "Con láminas de boletus frescos y parmesano reggiano 36 meses"),
            // Quesos
            Map.entry("Seleccion de quesos nacionales e internacionales con mermeladas y frutos secos",
                      "Selección de quesos nacionales e internacionales con mermeladas y frutos secos"),
            Map.entry("Queso extremeno cremoso de oveja merina con dulce de membrillo artesano",
                      "Queso extremeño cremoso de oveja merina con dulce de membrillo artesano"),
            // Postres
            Map.entry("Con helado de azafran y crumble de pistacho",
                      "Con helado de azafrán y crumble de pistacho"),
            Map.entry("Crema catalana clasica con mango exotico marinado",
                      "Crema catalana clásica con mango exótico marinado"),
            Map.entry("Seleccion de mignardises y bombones artesanos",
                      "Selección de mignardises y bombones artesanos"),
            // Vinos
            Map.entry("Ribera del Duero, cosecha seleccionada por la bodega",
                      "Ribera del Duero, cosecha seleccionada por la bodega"),  // sin cambio
            Map.entry("Rias Baixas, fresco y mineral",
                      "Rías Baixas, fresco y mineral"),
            Map.entry("Brut Nature, 15 anos de crianza en botella",
                      "Brut Nature, 15 años de crianza en botella"),
            Map.entry("Seleccion del sumiller, D.O. Ribera del Duero",
                      "Selección del sumiller, D.O. Ribera del Duero"),
            Map.entry("Seleccion del sumiller, D.O. Rias Baixas",
                      "Selección del sumiller, D.O. Rías Baixas"),
            // Cócteles
            Map.entry("Whisky Nikka From the Barrel, azucar de cana y angostura",
                      "Whisky Nikka From the Barrel, azúcar de caña y angostura"),
            Map.entry("Ron blanco, menta fresca, lima y azucar moreno",
                      "Ron blanco, menta fresca, lima y azúcar moreno"),
            // Bebidas
            Map.entry("Cola, limon o naranja",
                      "Cola, limón o naranja"),
            Map.entry("Cafe de origen unico, molido al momento",
                      "Café de origen único, molido al momento"),
            Map.entry("Seleccion de tes y tisanas premium",
                      "Selección de tés y tisanas premium")
        );

        for (Producto p : productoRepository.findAll()) {
            boolean changed = false;

            String newName = namesFix.get(p.getNombre());
            if (newName != null && !newName.equals(p.getNombre())) {
                p.setNombre(newName);
                changed = true;
            }

            String newDesc = descFix.get(p.getDescripcion());
            if (newDesc != null && !newDesc.equals(p.getDescripcion())) {
                p.setDescripcion(newDesc);
                changed = true;
            }

            if (changed) {
                productoRepository.save(p);
                count++;
            }
        }
        return count;
    }

    // CARGA INICIAL

    private void seedCatalogo() {
        try {
            // CATEGORÍAS
            Categoria entrantes  = cat("Entrantes");
            Categoria sopas      = cat("Sopas y Cremas");
            Categoria ensaladas  = cat("Ensaladas");
            Categoria pescados   = cat("Pescados y Mariscos");
            Categoria carnes     = cat("Carnes");
            Categoria arroces    = cat("Arroces y Pastas");
            Categoria quesos     = cat("Quesos");
            Categoria postres    = cat("Postres");
            Categoria vinos      = cat("Vinos y Cavas");
            Categoria cocteles   = cat("Cócteles de Autor");
            Categoria bebidas    = cat("Bebidas");

            // ENTRANTES
            prod(entrantes, "Jamón Ibérico de Bellota D.O.",
                    "Jamón de pata negra 100% ibérico de bellota, cortado a cuchillo",
                    "34.00", 10);
            prod(entrantes, "Croquetas de Cocido Madrileño (8 uds)",
                    "Croquetas cremosas de cocido madrileño tradicional, bechamel de tuétano",
                    "18.00", 10);
            prod(entrantes, "Ostras Finas de Bretaña (6 uds)",
                    "Con granizado de limón y vinagreta de chalota",
                    "28.00", 10);
            prod(entrantes, "Tartar de Atún Rojo con Aguacate",
                    "Atún rojo de almadraba, aguacate, soja ponzu y sésamo tostado",
                    "26.00", 10);
            prod(entrantes, "Foie Gras a la Plancha",
                    "Con reducción de Pedro Ximénez y mango caramelizado",
                    "32.00", 10);
            prod(entrantes, "Zamburiñas a la Gallega",
                    "A la plancha con aceite de oliva virgen extra y pimentón de la Vera",
                    "24.00", 10);

            // SOPAS Y CREMAS
            prod(sopas, "Gazpacho Tradicional Andaluz",
                    "Con virutas de jamón ibérico y aceite de oliva virgen extra",
                    "14.00", 10);
            prod(sopas, "Crema de Hongos Silvestres",
                    "Con aceite de trufa negra y crujiente de pan de castaña",
                    "18.00", 10);
            prod(sopas, "Consomé de Ave con Ravioli de Tuétano",
                    "Caldo de ave concentrado y ravioli casero relleno de tuétano y hierbas",
                    "16.00", 10);
            prod(sopas, "Sopa Castellana de Ajo",
                    "Receta tradicional madrileña con huevo escalfado y pan tostado",
                    "13.00", 10);

            // ENSALADAS
            prod(ensaladas, "Ensalada de Burrata",
                    "Burrata fresca, tomate Kumato, albahaca y pesto de piñones",
                    "19.00", 10);
            prod(ensaladas, "Ensalada Templada de Vieiras",
                    "Con espárragos blancos de Navarra y vinagreta de cítricos",
                    "24.00", 10);
            prod(ensaladas, "Mezclum con Anchoas del Cantábrico",
                    "Lechugas de temporada, anchoas premium y vinagreta de Módena",
                    "17.00", 10);

            // PESCADOS Y MARISCOS
            prod(pescados, "Lubina Salvaje a la Sal",
                    "Con verduras de temporada y aceite de oliva virgen extra",
                    "42.00", 10);
            prod(pescados, "Rodaballo al Horno",
                    "Con patatas panadera y salsa de azafrán",
                    "46.00", 10);
            prod(pescados, "Merluza de Pincho en Salsa Verde",
                    "Con almejas de Carril y guisantes frescos de temporada",
                    "38.00", 10);
            prod(pescados, "Pulpo a Feira",
                    "Con pimentón de la Vera, aceite de oliva y patata cocida",
                    "34.00", 10);
            prod(pescados, "Langostinos de Sanlúcar a la Plancha (6 uds)",
                    "Langostino jumbo con alioli de ajo negro",
                    "36.00", 10);
            prod(pescados, "Bacalao Confitado con Pil-pil",
                    "Bacalao de Islandia con pil-pil clásico y pimiento del piquillo confitado",
                    "36.00", 10);

            // CARNES
            prod(carnes, "Cochinillo Asado Segoviano",
                    "Al horno de leña, con ensalada verde y dulce de membrillo",
                    "48.00", 10);
            prod(carnes, "Solomillo de Buey Gallego con Foie y Trufa",
                    "Con escalopa de foie gras, láminas de trufa negra y reducción de Oporto",
                    "58.00", 10);
            prod(carnes, "Cordero Lechal Asado",
                    "Asado en horno de leña con jugo de asado y hierbas aromáticas",
                    "44.00", 10);
            prod(carnes, "Pichón de Bresse",
                    "Con puré trufado y jugo de asado al vino tinto",
                    "52.00", 10);
            prod(carnes, "Carrillera de Ibérico Estofada",
                    "Estofada en vino tinto Ribera del Duero con puré de apionabo",
                    "36.00", 10);
            prod(carnes, "Cocido Madrileño Completo (para 2)",
                    "Servido en tres vuelcos: sopa, garbanzos con verduras y carnes",
                    "68.00", 10);

            // ARROCES Y PASTAS
            prod(arroces, "Arroz Meloso con Bogavante",
                    "Arroz de Calasparra con bogavante vivo y sofrito de tomate",
                    "52.00", 10);
            prod(arroces, "Fideuá de Mariscos",
                    "Con alioli de ajo negro y fondo de marisco",
                    "34.00", 10);
            prod(arroces, "Risotto de Boletus y Parmesano",
                    "Con láminas de boletus frescos y parmesano reggiano 36 meses",
                    "28.00", 10);
            prod(arroces, "Pasta Fresca con Trufa Negra",
                    "Pasta artesana, trufa negra de Teruel y parmesano reggiano",
                    "32.00", 10);

            // QUESOS
            prod(quesos, "Tabla de Quesos Selectos de Temporada",
                    "Selección de quesos nacionales e internacionales con mermeladas y frutos secos",
                    "22.00", 10);
            prod(quesos, "Torta del Casar con Membrillo",
                    "Queso extremeño cremoso de oveja merina con dulce de membrillo artesano",
                    "18.00", 10);

            // POSTRES
            prod(postres, "Soufflé de Chocolate Valrhona",
                    "Con helado de vainilla de Madagascar",
                    "14.00", 10);
            prod(postres, "Tarta Tatin de Manzana",
                    "Con helado de vainilla y caramelo salado de mantequilla",
                    "12.00", 10);
            prod(postres, "Torrija Caramelizada",
                    "Con helado de leche merengada y canela",
                    "11.00", 10);
            prod(postres, "Coulant de Chocolate Negro",
                    "Con helado de azafrán y crumble de pistacho",
                    "13.00", 10);
            prod(postres, "Crema Catalana con Mango",
                    "Crema catalana clásica con mango exótico marinado",
                    "10.00", 10);
            prod(postres, "Petit Fours de la Casa",
                    "Selección de mignardises y bombones artesanos",
                    "8.00", 10);

            // VINOS Y CAVAS
            prod(vinos, "Vega Sicilia Único (copa)",
                    "Ribera del Duero, cosecha seleccionada por la bodega",
                    "65.00", 21);
            prod(vinos, "Pingus (copa)",
                    "Ribera del Duero, Peter Sisseck",
                    "48.00", 21);
            prod(vinos, "Marqués de Riscal Gran Reserva (copa)",
                    "Rioja Gran Reserva",
                    "18.00", 21);
            prod(vinos, "Albariño Pazo de Señoráns (copa)",
                    "Rías Baixas, fresco y mineral",
                    "14.00", 21);
            prod(vinos, "Cava Gramona III Lustros (copa)",
                    "Brut Nature, 15 años de crianza en botella",
                    "16.00", 21);
            prod(vinos, "Vino de la Casa Tinto (botella)",
                    "Selección del sumiller, D.O. Ribera del Duero",
                    "28.00", 21);
            prod(vinos, "Vino de la Casa Blanco (botella)",
                    "Selección del sumiller, D.O. Rías Baixas",
                    "26.00", 21);

            // CÓCTELES DE AUTOR
            prod(cocteles, "Martini de Trufa Negra",
                    "Vodka premium, vermut seco y aceite de trufa negra",
                    "18.00", 21);
            prod(cocteles, "Spritz de Cava con Frambuesa",
                    "Cava brut, Aperol y frambuesa fresca de temporada",
                    "14.00", 21);
            prod(cocteles, "Old Fashioned Japonés",
                    "Whisky Nikka From the Barrel, azúcar de caña y angostura",
                    "22.00", 21);
            prod(cocteles, "Negroni de Autor",
                    "Ginebra premium, Campari y vermut envejecido en barrica",
                    "20.00", 21);
            prod(cocteles, "Mojito de Temporada",
                    "Ron blanco, menta fresca, lima y azúcar moreno",
                    "16.00", 21);
            prod(cocteles, "Virgin Sangría de Temporada",
                    "Sin alcohol, con frutas frescas de temporada y especias",
                    "12.00", 10);

            // BEBIDAS
            prod(bebidas, "Agua Mineral sin Gas (50 cl)",
                    "Agua de manantial nacional",
                    "5.00", 10);
            prod(bebidas, "Agua con Gas Perrier (33 cl)",
                    "Agua mineral efervescente francesa",
                    "5.50", 10);
            prod(bebidas, "Refresco",
                    "Cola, limón o naranja",
                    "4.50", 10);
            prod(bebidas, "Zumo Natural de Naranja",
                    "Zumo exprimido al momento",
                    "6.00", 10);
            prod(bebidas, "Café Espresso",
                    "Café de origen único, molido al momento",
                    "3.50", 10);
            prod(bebidas, "Café Cortado",
                    "Espresso con un toque de leche caliente vaporizada",
                    "3.50", 10);
            prod(bebidas, "Té o Infusión Selección",
                    "Selección de tés y tisanas premium",
                    "4.50", 10);

        } catch (Exception e) {
            log.error("[DataInitializer] Error durante la carga del catálogo: {}", e.getMessage(), e);
        }
    }

    private Categoria cat(String nombre) {
        Categoria c = new Categoria();
        c.setNombre(nombre);
        return categoriaRepository.save(c);
    }

    private void prod(Categoria categoria, String nombre, String descripcion,
                      String precio, int iva) {
        try {
            Producto p = new Producto();
            p.setCategoria(categoria);
            p.setNombre(nombre);
            p.setDescripcion(descripcion);
            p.setPrecio(new BigDecimal(precio));
            p.setStockActual(99);
            p.setPorcentajeIva(iva);
            productoRepository.save(p);
        } catch (Exception e) {
            log.warn("[DataInitializer] No se pudo guardar '{}': {}", nombre, e.getMessage());
        }
    }
}
