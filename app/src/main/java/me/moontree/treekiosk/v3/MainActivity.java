package me.moontree.treekiosk.v3;

import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import io.appwrite.Client;
import io.appwrite.exceptions.AppwriteException;
import io.appwrite.services.Account;
import io.appwrite.services.Databases;
import io.appwrite.Query;
import org.json.JSONObject;
import org.json.JSONArray;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private Account account;
    private Databases database;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webView.setWebViewClient(new WebViewClient());

        // WebView에 JavaScript 인터페이스 추가
        webView.addJavascriptInterface(new AndroidInterface(), "AndroidInterface");

        // 로드할 HTML 페이지 (예: assets 내 HTML 파일 사용)
        webView.loadUrl("file:///android_asset/android.html");
    }

    private class AndroidInterface {
        private final Client client;

        public AndroidInterface() {
            client = new Client(MainActivity.this)
                    .setEndpoint("https://cloud.appwrite.io/v1") // Appwrite 엔드포인트
                    .setProject("treekiosk"); // 프로젝트 ID

            account = new Account(client);
            database = new Databases(client);
        }

        @JavascriptInterface
        public void loginWithOAuth() {
            runOnUiThread(() -> {
                try {
                    JSONObject user = account.get(); // 현재 로그인된 사용자 정보 가져오기
                    String email = user.getString("email");

                    setLocalUserData(email);
                } catch (AppwriteException e) {
                    e.printStackTrace();
                    webView.post(() -> webView.evaluateJavascript("handleAuthResult(false, false);", null));
                }
            });
        }

        @JavascriptInterface
        public void setLocalUserData(String email) {
            new Thread(() -> {
                try {
                    JSONObject response = database.listDocuments(
                            "tree-kiosk",   // 데이터베이스 ID
                            "owner",        // 컬렉션 ID
                            new String[]{Query.equal("email", email)} // 이메일로 필터링
                    );

                    JSONArray documents = response.getJSONArray("documents");
                    if (documents.length() == 0) {
                        runOnUiThread(() -> webView.evaluateJavascript("handleAuthResult(false, false);", null));
                        return;
                    }

                    JSONObject document = documents.getJSONObject(0);
                    String name = document.getString("name");
                    boolean active = document.getBoolean("active");

                    boolean isMember = active;

                    // JavaScript로 결과 전달
                    runOnUiThread(() -> webView.evaluateJavascript(
                        "handleAuthResult(true, " + isMember + ");", null
                    ));
                } catch (Exception e) {
                    e.printStackTrace();
                    runOnUiThread(() -> webView.evaluateJavascript("handleAuthResult(false, false);", null));
                }
            }).start();
        }
    }
}
