package com.tallt.marketplace.config;

import java.io.IOException;

import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;

import com.tallt.marketplace.repository.UserRepository;

public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
     private final UserRepository userRepository;
    private final jwtService jwtService;

    public OAuth2SuccessHandler(UserRepository userRepository,
                                jwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException, ServletException {

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {

                    User newUser = new User();
                    newUser.setEmail(email);
                    newUser.setUsername(name);
                    newUser.setRole("CUSTOMER");

                    return userRepository.save(newUser);
                });

        String token = jwtService.generateToken(user);

        String redirectUrl =
                "http://localhost:5173/authenticate#access_token=" + token;

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
