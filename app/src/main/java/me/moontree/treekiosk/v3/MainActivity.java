package me.moontree.treekiosk.v3;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        WebView webView = findViewById(R.id.webView);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);  // JavaScript 활성화
        webSettings.setDomStorageEnabled(true);  // PWA 지원

        webView.setWebViewClient(new WebViewClient());

        // `3.1/assets` 폴더에서 가져온 로컬 파일 로드
        webView.loadUrl("file:///android_asset/index.html");
    }
}
