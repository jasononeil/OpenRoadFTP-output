<?php

class AppConfig {
	public function __construct(){}
	static $ftpServer = "192.168.55.1";
	static $siteTitle = "Student Logon";
	static $sessionID = "StudentLoginSessionID";
	static $sessionTimeOut = 300;
	static $limitSymlinks = false;
	static $allowedSymlinks;
	static function getHomeDir($username) {
		$home = null;
		$yearAtEndOfUsername = new EReg("[0-9]{4}\$", "");
		if($yearAtEndOfUsername->match($username)) {
			$yeargroup = $yearAtEndOfUsername->matched(0);
			$home = "/home/students/" . $yeargroup . "/" . $username;
		} else {
			$home = "/home/staff/" . $username;
		}
		return $home;
	}
	function __toString() { return 'AppConfig'; }
}
AppConfig::$allowedSymlinks = new _hx_array(array("YDrive", "SDrive"));
