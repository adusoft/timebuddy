package com.adusoft.web;

import com.adusoft.model.User;
import com.adusoft.repository.UserRepository;
import com.adusoft.web.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

import static org.springframework.http.HttpStatus.CREATED;
import static org.springframework.http.HttpStatus.OK;
import static org.springframework.web.bind.annotation.RequestMethod.*;

/**
 * User Controller handles User CRUD actions.
 * NOTE: User Controller is only for verification purposes to check registered users. It wouldn't be included in the final release.
 */
@Controller
@RequestMapping(value = "/user", produces = "application/json")
public class UserController {

  @Autowired
  private UserRepository userRepository;
  private User savedUser;

  @RequestMapping(method = RequestMethod.GET)
  @ResponseBody
  public List<User> list() {
    return userRepository.findAll();
  }

  @RequestMapping(value = "{id}", method = GET)
  @ResponseBody
  public User get(@PathVariable Long id) {
    return userRepository.findOne(id);
  }

  @RequestMapping(method = POST, consumes = "application/json")
  @ResponseStatus(CREATED)
  @ResponseBody
  public Long create(@Valid @RequestBody User user) {
    try {
      User savedUser = userRepository.save(user);
      return savedUser.getId();
    } catch (DataIntegrityViolationException e) {
      throw new BadRequestException("Username already exists");
    }
  }

//  @RequestMapping(value = "{id}", method = PUT, consumes = "application/json")
//  @ResponseStatus(OK)
//  @ResponseBody
//  public User update(@Valid @RequestBody User user, @PathVariable Long id) {
//    return userRepository.save(user);
//  }

  @RequestMapping(value = "{id}", method = DELETE)
  @ResponseStatus(OK)
  public void delete(@PathVariable Long id) {
    userRepository.delete(id);
  }

}
