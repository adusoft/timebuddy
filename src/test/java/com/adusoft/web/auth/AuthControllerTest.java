package com.adusoft.web.auth;

import com.adusoft.config.PersistenceConfig;
import com.adusoft.config.WebConfig;
import com.adusoft.model.User;
import com.adusoft.repository.UserRepository;
import com.adusoft.web.exception.BadRequestException;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = {WebConfig.class, PersistenceConfig.class})
@WebAppConfiguration
public class AuthControllerTest {

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private AuthController authController;

  @Test
  public void registerUser() {

    User user = new User();
    user.setFirstName("First name");
    user.setLastName("Last name");
    user.setUsername("testUsername");
    user.setPassword("testPassword");

    authController.register(user);

    User testUser = userRepository.findByUsername("testUsername");

    Assert.assertEquals(user.getFirstName(), testUser.getFirstName());
  }

  @Test(expected = BadRequestException.class)
  public void shouldNotRegisterTwoUsersWithSameUsername() {

    User user1 = new User();
    user1.setFirstName("First name #1");
    user1.setLastName("Last name #1");
    user1.setUsername("testUsername");
    user1.setPassword("testPassword");

    User user2 = new User();
    user2.setFirstName("First name #2");
    user2.setLastName("Last name #2");
    user2.setUsername("testUsername");
    user2.setPassword("testPassword");

    authController.register(user1);
    authController.register(user2);
  }

}
