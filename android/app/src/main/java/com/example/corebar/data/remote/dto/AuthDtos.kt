package com.example.corebar.data.remote.dto

data class LoginRequestBody(
    val username: String,
    val password: String,
)

data class AuthResponseDto(
    val accessToken: String?,
    val tokenType: String?,
    val expiresIn: Long?,
    val usuario: UsuarioAuthDto?,
)

data class UsuarioAuthDto(
    val idUsuario: Int?,
    val nombre: String?,
    val username: String?,
    val rol: String?,
)
