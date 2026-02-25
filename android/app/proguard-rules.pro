# Capacitor WebView bridge
-keep class com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep @com.getcapacitor.annotation.Permission class * { *; }

# Google AdMob
-keep class com.google.android.gms.ads.** { *; }
-dontwarn com.google.android.gms.ads.**
-keep class com.getcapacitor.community.admob.** { *; }

# Google Play Services
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# AndroidX
-keep class androidx.** { *; }
-dontwarn androidx.**

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**

# Stack trace line numbers
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
