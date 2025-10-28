package com.lumeo.lumeo.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "divisa")
public class DivisaModel {
    
    @Id
    private Long id;
    
    @Column(name = "descripcion")
    private String descripcion;
    
    @Column(name = "iso")
    private String iso;
}