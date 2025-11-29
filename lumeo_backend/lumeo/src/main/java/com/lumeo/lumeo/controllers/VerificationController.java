package com.lumeo.lumeo.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/public") // O la ruta base que prefieras
public class VerificationController {

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
                    .btn {
                        display: inline-block;
                        margin-top: 20px;
                        padding: 12px 24px;
                        background-color: #3498db;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>¡Cuenta Verificada!</h1>
                    <p>Tu correo electrónico ha sido confirmado correctamente en nuestra base de datos.</p>
                    <p>Ya puedes cerrar esta ventana y volver a la aplicación.</p>
                </div>
            </body>
            </html>
            """;
    }
}