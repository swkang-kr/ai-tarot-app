package com.aitarot.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

/**
 * OAuth 콜백을 받아 MainActivity로 전달하는 딥링크 핸들러.
 * Supabase Google OAuth 완료 후 com.aitarot.app://auth/callback 으로 리디렉트됨.
 */
public class OAuthActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Uri uri = getIntent().getData();
        if (uri != null) {
            String query = uri.getQuery() != null ? uri.getQuery() : "";
            String fragment = uri.getFragment() != null ? "#" + uri.getFragment() : "";
            String webUrl = "https://tarot.trendhunt.net/auth/callback?" + query + fragment;

            Intent mainIntent = new Intent(this, MainActivity.class);
            mainIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            mainIntent.putExtra("oauth_url", webUrl);
            startActivity(mainIntent);
        }

        finish();
    }
}
