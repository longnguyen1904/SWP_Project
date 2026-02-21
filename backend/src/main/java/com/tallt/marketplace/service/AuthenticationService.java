package com.tallt.marketplace.service;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import com.tallt.marketplace.dto.request.AuthenticationRequest;
import com.tallt.marketplace.dto.request.IntrospectRequest;
import com.tallt.marketplace.dto.response.AuthenticationResponse;
import com.tallt.marketplace.dto.response.IntrospectResponse;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.exception.ErrorCode;
import com.tallt.marketplace.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * Service xác thực (Authentication): cấp phát JWT Token, kiểm tra Token (introspect).
 * Tách riêng khỏi UserService theo Separation of Concerns. User trong project này có đúng 1 Role (@ManyToOne),
 * không dùng Set&lt;Role&gt; như project mẫu Devteria.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class AuthenticationService {

    UserRepository userRepository;
    PasswordEncoder passwordEncoder;

    /** Secret key để ký JWT (HS512), đọc từ application.yaml. Không dùng final vì @Value inject sau khi tạo bean. */
    @Value("${jwt.signerKey}")
    String signerKey;

    /** Thời gian sống token (giây), đọc từ application.yaml. */
    @Value("${jwt.valid-duration}")
    long validDuration;

    /**
     * Sinh JWT Token từ thông tin User (sau khi đã xác thực email/password thành công).
     *
     * CẤU TRÚC JWT GỒM 3 PHẦN (Header.Payload.Signature):
     *
     * 1) HEADER: Chứa thuật toán ký (alg) và loại token (typ). Ở đây dùng HS512 (HMAC SHA-512):
     *    server dùng một chuỗi bí mật (signerKey) để ký; ai giữ key mới verify được. Header được base64url encode.
     *
     * 2) PAYLOAD (Claims): Chứa dữ liệu ta muốn gửi kèm token:
     *    - subject (sub): định danh user, dùng email.
     *    - issuer (iss): ai phát hành token (vd: "marketplace").
     *    - issueTime (iat): thời điểm phát hành.
     *    - expirationTime (exp): thời điểm hết hạn (issueTime + validDuration giây).
     *    - jwtID (jti): ID duy nhất của token (UUID), tránh trùng.
     *    - scope: quyền của user. Vì User chỉ có 1 Role (khác Devteria có Set<Role>), ta chỉ cần
     *      "ROLE_" + user.getRole().getRoleName() (vd: "ROLE_Customer"). Sau này phân quyền sẽ đọc claim "scope".
     *
     * 3) SIGNATURE (Chữ ký): Server dùng MACSigner với signerKey để ký lên (Header + Payload). Client không thể
     *    sửa Payload mà vẫn giữ chữ ký đúng vì không biết key. Khi verify, server dùng MACVerifier với cùng key
     *    để kiểm tra chữ ký có khớp không.
     */
    public String generateToken(User user) {
        try {
            JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

            Date now = new Date();
            Date expirationTime = new Date(now.getTime() + validDuration * 1000L);

            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .subject(user.getEmail())
                    .issuer("marketplace")
                    .issueTime(now)
                    .expirationTime(expirationTime)
                    .jwtID(UUID.randomUUID().toString())
                    .claim("scope", "ROLE_" + user.getRole().getRoleName())
                    .build();

            SignedJWT signedJWT = new SignedJWT(header, claims);
            signedJWT.sign(new MACSigner(signerKey.getBytes(StandardCharsets.UTF_8)));

            return signedJWT.serialize();
        } catch (Exception e) {
            throw new RuntimeException("Không thể tạo token", e);
        }
    }

    /**
     * Kiểm tra token còn hợp lệ hay không (Introspect). Client (vd: Frontend hoặc API Gateway) gửi token
     * lên endpoint này để biết có nên cho phép truy cập tài nguyên bảo vệ hay không.
     *
     * TẠI SAO CẦN API INTROSPECT?
     * - Token có thể bị hết hạn (exp) hoặc bị thu hồi (nếu sau này có blacklist). Chỉ đọc token ở client
     *   không đủ vì client có thể sửa. Server phải tự verify chữ ký và thời hạn.
     * - Introspect = "nhìn vào trong" token: parse Payload, verify Signature, kiểm tra exp. Trả về valid true/false.
     *
     * CÁCH HOẠT ĐỘNG:
     * 1) Parse chuỗi token thành SignedJWT (Nimbus kiểm tra format 3 phần Header.Payload.Signature).
     * 2) Tạo MACVerifier với cùng signerKey đã dùng để ký. Verify chữ ký: nếu Payload bị sửa thì chữ ký không khớp.
     * 3) Kiểm tra expirationTime: nếu exp đã qua (trước thời điểm hiện tại) thì token hết hạn.
     * 4) Trả về IntrospectResponse(valid = true) chỉ khi chữ ký đúng VÀ chưa hết hạn; ngược lại hoặc parse lỗi thì valid = false.
     */
    public IntrospectResponse introspect(IntrospectRequest request) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(request.getToken());

            MACVerifier verifier = new MACVerifier(signerKey.getBytes(StandardCharsets.UTF_8));
            if (!signedJWT.verify(verifier)) {
                return IntrospectResponse.builder().valid(false).build();
            }

            Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
            if (expirationTime == null || !expirationTime.after(new Date())) {
                return IntrospectResponse.builder().valid(false).build();
            }

            return IntrospectResponse.builder().valid(true).build();
        } catch (Exception e) {
            return IntrospectResponse.builder().valid(false).build();
        }
    }

    /**
     * Xác thực email/password và cấp JWT thật (gọi generateToken), không còn trả token giả.
     */
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        User user = userRepository.findByEmail(request.getEmail());

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.LOGIN_FAILED);
        }

        String token = generateToken(user);
        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(true)
                .build();
    }
}
