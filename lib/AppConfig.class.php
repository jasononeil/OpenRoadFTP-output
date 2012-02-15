<?php

class AppConfig {
	public function __construct(){}
	static $ftpServer = "localhost";
	static $siteTitle = "OpenRoad FTP";
	static $sessionID = "WbcStudentLoginSessionID";
	static $sessionTimeOut = 300;
	static $limitSymlinks = false;
	static $allowedSymlinks;
	static function getHomeDir($username) {
		return "/home/" . $username;
	}
	function __toString() { return 'AppConfig'; }
}
AppConfig::$allowedSymlinks = new _hx_array(array());
