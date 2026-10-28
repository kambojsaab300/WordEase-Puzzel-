# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Libraries whose Java classes are looked up by name from C++ (JNI / fbjni / Nitro) or by
# reflection, and that ship no consumer rules of their own. Renaming them crashes at runtime.
-keep class com.reactnative.skia.** { *; }
-keep class com.margelo.nitro.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.th3rdwave.safeareacontext.** { *; }
-keep class com.learnium.RNDeviceInfo.** { *; }
-keep class com.sudoplz.rninappupdates.** { *; }

# Our own native sound module (also covered by React Native's NativeModule rule)
-keep class com.wordease.** { *; }
