package com.example.corebar.data.local

import android.content.Context
import com.google.gson.Gson

/** Persistencia local del mapa (la API solo lista mesas; no hay coordenadas en BD) */
class FloorPlanRepository(context: Context) {

    private val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    private val gson = Gson()

    fun load(): FloorPlanSnapshot {
        val raw = prefs.getString(KEY_JSON, null) ?: return FloorPlanSnapshot()
        return runCatching { gson.fromJson(raw, FloorPlanSnapshot::class.java) }
            .getOrElse { FloorPlanSnapshot() }
    }

    fun save(snapshot: FloorPlanSnapshot) {
        prefs.edit().putString(KEY_JSON, gson.toJson(snapshot)).apply()
    }

    companion object {
        private const val PREFS = "corebar_floor_plan"
        private const val KEY_JSON = "layout_json"
    }
}
