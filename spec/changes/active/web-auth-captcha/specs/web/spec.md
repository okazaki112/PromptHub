# Web Delta Spec

## Added Requirements

### Requirement: Auth forms require a valid captcha challenge

Web 登录与首次初始化表单必须在提交用户名和密码之外，同时提交一个有效的一次性验证码答案。

#### Scenario: login without captcha

- Given 用户访问登录页
- When 客户端未提交有效 `captchaId` 或 `captchaAnswer`
- Then 服务端拒绝登录请求

#### Scenario: setup without captcha

- Given 实例尚未初始化
- When 用户提交初始化管理员表单但验证码无效
- Then 服务端拒绝注册请求

#### Scenario: captcha refresh after failed submit

- Given 用户提交了错误验证码
- When 前端收到校验失败响应
- Then 前端刷新 challenge，避免重复提交旧验证码
