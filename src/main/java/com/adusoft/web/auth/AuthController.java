package com.adusoft.web.auth;

import com.adusoft.model.User;
import com.adusoft.repository.UserRepository;
import com.adusoft.web.exception.BadRequestException;
import com.adusoft.web.exception.NotAuthorizedUserException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

import javax.validation.Valid;

import static org.springframework.http.HttpStatus.OK;
import static org.springframework.web.bind.annotation.RequestMethod.POST;

/**
 * AuthController is an authentication REST service. It handles User registration and User login.
 */
@Controller
@RequestMapping(value = "/auth", produces = "application/json")
@Scope("request")
public class AuthController {

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private AuthSession authSession;

  @RequestMapping(value = "/register", method = POST, consumes = "application/json")
  @ResponseStatus(OK)
  @ResponseBody
  public void register(@Valid @RequestBody User user) {
    user.setPassword(authSession.hashPassword(user.getPassword()));
    try {
      userRepository.save(user);
    } catch (DataIntegrityViolationException e) {
      throw new BadRequestException("Username already exists");
    }
  }

  @RequestMapping(value = "/login", method = POST, consumes = "application/json")
  @ResponseStatus(OK)
  @ResponseBody
  public String login(@Valid @RequestBody AuthUserDto authUserDto) {
    User user = userRepository.findByUsername(authUserDto.getUsername());
    if (user == null) {
      throw new NotAuthorizedUserException("Could not log in. You have not provided valid authentication credentials.");
    }

    String passwordHash = authSession.hashPassword(authUserDto.getPassword());
    if (!passwordHash.equals(user.getPassword())) {
      throw new NotAuthorizedUserException("Could not log in. You have not provided valid authentication credentials.");
    }

    String token = authSession.generateToken();
    authSession.registerUser(token, authUserDto.getUsername());
    return "{\"authToken\":\"" + token + "\"}";
  }

}
