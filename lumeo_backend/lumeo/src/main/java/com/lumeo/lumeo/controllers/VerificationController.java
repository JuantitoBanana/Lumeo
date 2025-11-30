package com.lumeo.lumeo.controllers;

import com.lumeo.lumeo.services.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class VerificationController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping(value = "/email-success", produces = MediaType.TEXT_HTML_VALUE)
    public String emailSuccess() {
        return """
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Cuenta Verificada</title>
                    <style>
                        /* ... Tus estilos anteriores (los mantengo igual) ... */
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background-color: #f0f2f5;
                        }
                        .card {
                            background: white;
                            padding: 40px;
                            border-radius: 12px;
                            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                            text-align: center;
                            max-width: 90%;
                            width: 400px;
                        }
                        h1 { color: #2ecc71; margin-bottom: 20px; }
                        p { color: #555; font-size: 16px; line-height: 1.5; }
                    </style>

                    <script>
                        window.onload = function() {
                            // Si hay un "hash" (lo que sigue al #) en la URL...
                            if (window.location.hash) {
                                // Reemplaza la URL actual en el historial por una limpia (solo el path)
                                history.replaceState(null, null, window.location.pathname);
                            }
                        }
                    </script>

                </head>
                <body>
                    <div class="card">
                        <h1>¡Cuenta Verificada!</h1>
                        <p>Tu correo electrónico ha sido confirmado correctamente.</p>
                        <p>Ya puedes volver a la aplicación.</p>
                    </div>
                </body>
                </html>
                """;
    }

    @GetMapping("/check-username/{username}")
    public ResponseEntity<Map<String, Boolean>> checkUsername(@PathVariable String username) {
        boolean exists = usuarioService.existsByNombreUsuario(username);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @GetMapping("/check-email/{email}")
    public ResponseEntity<Map<String, Boolean>> checkEmail(@PathVariable String email) {
        boolean exists = usuarioService.existsByEmail(email);
        return ResponseEntity.ok(Map.of("exists", exists));
    }
}