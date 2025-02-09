package me.moontree.treekiosk.v3;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;
import io.appwrite.Client;
import io.appwrite.services.Account;
import io.appwrite.exceptions.AppwriteException;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private Client client;
    private Account account;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient());

        // Appwrite 클라이언트 설정
        client = new Client(this)
            .setEndpoint("https://cloud.appwrite.io/v1")  // Appwrite 엔드포인트
            .setProject("treekiosk");  // 프로젝트 ID

        account = new Account(client);

        // WebView에서 Java 메서드를 호출할 수 있도록 JavaScript 인터페이스 추가
        webView.addJavascriptInterface(new WebAppInterface(), "Android");

        // HTML 파일 로드 (assets 폴더에 index.html이 있어야 함)
        webView.loadUrl("file:///android_asset/index.html");
    }

    // WebView에서 호출할 JavaScript 인터페이스
    public class WebAppInterface {

        @JavascriptInterface
        public void loginWithGoogle() {
            runOnUiThread(() -> {
                try {
                    String successRedirect = "";  // 성공 시 리디렉션 URL
                    String failureRedirect = "";  // 실패 시 리디렉션 URL

                    // Google OAuth2 로그인 세션 생성
                    account.createOAuth2Session(
                        "google",  // OAuth 공급자
                        successRedirect,
                        failureRedirect
                    );

                } catch (AppwriteException e) {
                    e.printStackTrace();
                }
            });
        }
    }
}
