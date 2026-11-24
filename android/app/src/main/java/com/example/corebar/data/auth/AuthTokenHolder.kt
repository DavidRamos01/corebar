package com.example.corebar.data.auth

data class StoredUserProfile(
    val idUsuario: Int,
    val nombre: String? = null,
    val username: String? = null,
    val rol: String? = null,
)

/** Guarda en memoria el token JWT y el perfil del usuario con sesión iniciada. */
object AuthTokenHolder {
    @Volatile
    var accessToken: String? = null

    @Volatile
    var profile: StoredUserProfile? = null

    fun clear() {
        accessToken = null
        profile = null
    }
}
