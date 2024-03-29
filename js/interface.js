var interface = 
{
	setContentAreaHTML : function(html)
	{
		$("#content").empty().append($(html));
	},
	
	showLoginForm : function(message)
	{
		AjaxClient.proxy.session_getLoginForm(message, interface.cb_showLoginForm);
		$("#logout").hide();
	},
	
	cb_showLoginForm : function(str)
	{
		interface.setContentAreaHTML(str);
		Cufon.replace("#loginform h3, #loginform p, #loginform label, #loginform-submit", { fontFamily: "Oceania", textShadow: '#000 1px 1px' });
		interface.setBreadCrumbs("Sign In");
		$("#loginform-submit").click(function() 
		{
			$("#loginform form").submit();
		});
		$("#loginform form").submit(function () 
		{
			var user = $("#loginform-username").val();
			var pass = $("#loginform-password").val();
			
			AjaxClient.proxy.session_login(user,pass,interface.cb_submitLogin);
			
			// stop the form from doing it's default submit routine
			return false;
		});
	},
	
	cb_submitLogin : function()
	{
		interface.defaultAction();
		Cufon.replace("#logout", { fontFamily: "Oceania" });
		$("#logout").show();
	},
	
	logout : function()
	{
		AjaxClient.proxy.session_logoff();
	},
	
	currentDirectory : '/',
	
	gotoDirectory : function(path)
	{
		interface.currentDirectory = path;
		var ready = interface.showDirectory(path);
		if (ready)
		{
			interface.showDirListAndParents(path);
		}
	},
	
	refreshDirectory : function()
	{
		path = interface.currentDirectory;
		
		// AJAX call to load the new directory
		AjaxClient.proxy.getDirListing(path, interface.cb_addDirectory);
		$("#loading").show();
	},
	
	cb_refreshDirectory : function(str)
	{
		// we've got the content for the refreshed directory
		
		// so delete the old content
		var path = ($str).dirList.attr('title'); // recreates the whole tree, probably a better way, but meh
		var oldList = interface.getJqueryDirList(path);
		oldList.parent().remove(oldList);
		
		// and place in the new content
		interface.cb_addDirectory(str);
	},
	
	showDirectory : function(path)
	{
		var listToShow = interface.getJqueryDirList(path);
		var readyToShow = false;
		
		if (listToShow.length > 0)
		{
			listToShow.show();
			readyToShow = true;
		}
		else
		{
			AjaxClient.proxy.getDirListing(path, interface.cb_addDirectory);
			$("#loading").show();
		}
		
		return readyToShow;
	},
	
	hideDirectory : function(path)
	{
		var listToHide = interface.getJqueryDirList(path);
		if (listToHide.length > 0)
		{
			listToHide.hide();
		}
	},
	
	setBreadCrumbs : function(path)
	{
		// get rid of the old ones
		$("#breadcrumbs").empty();
		
		// if the first character is a /, it's a path.  Otherwise, it's a title.
		var firstChar = path.substr(0,1);
		if (firstChar == "/")
		{
			// cycle through the various folders in the path
			str = path.substr(1,path.length-2); // chop off the leading and trailing slash
			parents = str.split("/");
			interface.createBreadCrumbButton('Home','/');
			var fullPath = "/";
			if (path != "/")
			{
				for (i=0; i<parents.length; i++)
				{
					dirName = parents[i];
					fullPath = fullPath + dirName + '/';
					interface.createBreadCrumbButton(dirName,fullPath);
					var isCurrent = (fullPath == path);
					if (isCurrent)
					{
						interface.setCurrentBreadCrumb(fullPath);
					}
				}
			}
			else
			{
				// we're on root.  Already created it, just set it current
				interface.setCurrentBreadCrumb('/');
			}
		}
		else
		{
			// it's a title, just show that
			interface.createBreadCrumbButton('Sign In','/');
			interface.setCurrentBreadCrumb('/');
		}
		
		Cufon.replace("#breadcrumbs li .label", { fontFamily: "Oceania" });
	},
	
	createBreadCrumbButton : function(name,path)
	{
		var btn = $("<li><span class='path' title='" + path + "'>" + path + "</span><span class='label'>" + name + "</span></li>");
		btn.click(function ()
		{
			interface.gotoDirectory(path);
			interface.setCurrentBreadCrumb(path);
		});
		$("#breadcrumbs").append(btn);
	},
	
	setCurrentBreadCrumb : function(path)
	{
		$("#breadcrumbs li.current").removeClass('current');
		$("#breadcrumbs li .path[title=" + path + "]").parent().addClass('current');
	},
	
	showParentDirectory : function()
	{
		var current = interface.currentDirectory;
		var onlyLastName = /([^\/]+)\/$/;
		var parent = current.replace(onlyLastName,"");
		if (parent == "") { parent = "/"; }
		interface.gotoDirectory(parent);
		interface.setCurrentBreadCrumb(parent);
	},
	
	showDirListAndParents : function(path)
	{
		str = path.substr(1,path.length-2); // chop off the leading and trailing slash
		parents = str.split("/");
		
		//
		// Build up a list of all the ancestors to show
		//
		var elementsToShow = interface.getJqueryDirList('/');
		
		var currentDirList;
		if (path != "/")
		{
			// if we're not the root dir '/', then make the parents visible too
			var fullPath = "/";
			for (i=0; i<parents.length; i++)
			{
				dirName = parents[i];
				fullPath = fullPath + dirName + '/';
				var div = interface.getJqueryDirList(fullPath);
				elementsToShow = elementsToShow.add(div);
				
				if (i == parents.length - 1)
				{
					currentDirList = div;
					// this is the final one.  Line us up here.
				}
			}
		}
		else { currentDirList = elementsToShow; }
		
		// 
		// Slide over to the current directory
		//
		var offset = 0;
		if (path != "/")
		{
			var str = currentDirList.css('left');
			str = (str == null) ? "0" : str.replace('px','')
			offset = -parseFloat(str);
		}
		interface.slideBrowser(offset);
		
		//
		// Deselect all the files
		//
		interface.deselectFiles();
		
		//
		// Any elements further down the breadcrumbs chain 
		//  (if we're moving to a parent, the child we were on before)
		//  will be faded out.
		var breadcrumbsToFadeOut = $("#breadcrumbs").find("li .path:contains('" + path + "')");
		var dirListsToFadeOut = $();
		
		breadcrumbsToFadeOut.each(function () 
		{
			if (path != $(this).text())
			{
				var list = interface.getJqueryDirList($(this).text());
				dirListsToFadeOut = dirListsToFadeOut.add(list);
			}
		});
		
		
		//
		// Hide everything else
		//
		$("#content .dirList").not(elementsToShow).not(dirListsToFadeOut).hide();
		
		elementsToShow.show(1000);
		dirListsToFadeOut.hide(1000);
		interface.updateAvailableTools();
	},
	
	slideBrowser : function (slideTo)
	{
		// Animate the dir list container to slide.
		// There's a firefox glitch where non-overflow-hidden elements
		// animated inside an overflow-hidden element cause glitchyness.
		// solution is to set overflow to hidden, but we need to be able to scroll.
		// so disable it when animating, re-enable afterwards
		$('.dirList').css('overflow','hidden');
		$('#dirListContainer').animate(
		{
			left: slideTo + "px" 
		}, 800, 'easeInOutCirc', function()
		{
			$(this).find('.dirList').css('overflow','auto');
		});
	},
	
	getJqueryDirList : function (path)
	{
		var pattern = "div.dirList[title='" + path.replace("'","\\'") + "']";
		return $(pattern);
	},
	
	cb_addDirectory : function(str)
	{
		var dirList = $(str);
		dirList.hide();
		$("#dirListContainer").append(dirList);
		var path = dirList.attr('title');
		
		// make visible the parents of this, and position it correctly
		var str = path.substr(1,path.length-2); // chop off the leading and trailing slash
		var numDeep = (str== "") ? 0 : str.split("/").length;
		
		dirList.css('left', numDeep * dirList.width());
		
		// set the font for the dirList title
		//Cufon.replace(".dirList h4 span", { fontFamily: "Oceania" });
		// DISABLED because it wasn't working in IE :(
		
		// add the click functionality
		dirList.find('li').each(function (li)
		{
			var type = $(this).find("span.type").text();
			var path = $(this).find("span.path").text();
			
			$(this).addClass('button');
			
			interface.setUpFileInteractions($(this), path);
			if (type == 'dir')
			{
				$(this).addClass('dir');
				$(this).attr('title', "Hold down Ctrl when you click to select this folder.");
			}
			else
			{
				$(this).attr('title', "Click to select this file.  Hold Ctrl and click to select multiple files.");
			}
		});
		
		if (interface.currentDirectory == path)
		{
			$("#loading").hide();
			interface.gotoDirectory(path);
		}
		
		
	},
	
	setUpFileInteractions : function(fileButton, path)
	{
		fileButton.find('.label').click(function(evt)
		{
			if (evt.ctrlKey) { interface.selectAnotherFile(fileButton,path); }
			else if (evt.shiftKey) { interface.selectList(fileButton,path); }
			else 
			{
				var li = $(this).parent();
				var type = li.find('.type').text();
				if (type=="dir")
				{
					interface.gotoDirectory(path);
					interface.setBreadCrumbs(path);
				}
				else
				{
					interface.selectIndividualFile(fileButton,path); 
				}
			}
			evt.stopPropagation();
		})
		.mouseup(function ()
		{
			// prevent selection
			return false;
		});
	},
	
	selectIndividualFile : function(fileButton, path)
	{
		var dirList = fileButton.closest('div.dirList');
		interface.deselectFiles();
		fileButton.addClass('selected');
		interface.updateAvailableTools();
	},
	
	selectAnotherFile : function(fileButton, path)
	{
		var dirList = fileButton.closest('div.dirList');
		fileButton.toggleClass('selected');
		interface.updateAvailableTools();
	},
	
	selectList : function(fileButton, path)
	{
		var dirList = fileButton.closest('div.dirList');
		previouslySelectedList = dirList.find('.selected');
		if (previouslySelectedList.length > 0)
		{
			prev = previouslySelectedList.first();
			curr = fileButton;
			
			prevIndex = prev.index();
			currIndex = curr.index();
			
			var bottom, top;
			if (currIndex > prevIndex)
			{
				// if this link is further down than the first one
				top = prev;
				bottom = curr;
			}
			else
			{
				// this link is back up from the first one
				top = curr;
				bottom = prev;
			}
			
			// select all the ones inbetween the bottom and the top.
			bottom.addClass('selectAllUntilHere')
			var inbetweenElements = top.nextUntil('.selectAllUntilHere');
			bottom.removeClass('selectAllUntilHere');
			
			// add the first and the last file
			var listToSelect = $();
			listToSelect = listToSelect.add(prev).add(curr);
			listToSelect = listToSelect.add(inbetweenElements);
			
			interface.deselectFiles();
			listToSelect.addClass('selected');
		}
		else
		{
			// no others selected, so just select an individual file
			fileButton.addClass('selected');
		}
		
		interface.updateAvailableTools();
	},
	
	deselectFiles : function()
	{
		var currentDirList = interface.getJqueryDirList(interface.currentDirectory);
		currentDirList.find('.selected').toggleClass('selected');
		interface.updateAvailableTools();
	},
	
	renameFile : function()
	{
		// rename button has been clicked
		if ($("#rename").hasClass('disabled') == false)
		{
			var dirList = interface.getJqueryDirList(interface.currentDirectory);
			var selected = dirList.find('.selected').first();
			
			var oldName = selected.find('.name').text();
			var newName = prompt("Please enter new filename", oldName);
			
			// ([^\/]+) means anything except a slash, at least one character. The () group it for capturing
			// \/?$    means a forward slash (/) at the end of the line, or nothing
			var onlyLastName = /([^\/]+)\/?$/;
			
			// use this regexp to get the old path without the name
			var oldPath = selected.find('.path').text().replace(/\/$/,'');
			var oldPathWithoutName = oldPath.replace(onlyLastName,"");
			
			// so we can tag the new name on and make the new path
			var newPath = oldPathWithoutName + newName;
			
			AjaxClient.proxy.moveFile(oldPath,newPath,interface.refreshDirectory)
		}
		else
		{
			alert ('can only rename 1 file at a time');
		}
	},
	
	deleteFiles : function()
	{
		// delete button has been clicked
		if ($("#delete").hasClass('disabled') == false)
		{
			var dirList = interface.getJqueryDirList(interface.currentDirectory);
			var selectedList = dirList.find('.selected');
			
			var arrayOfFilesToDelete = new Array();
			
			selectedList.each(function ()
			{
				// find the path, get rid of the trailing slash
				var path = $(this).find('.path').text().replace(/\/$/,'');
				arrayOfFilesToDelete.push(path);
			});
			
			AjaxClient.proxy.deleteFiles(arrayOfFilesToDelete,interface.refreshDirectory)
		}
		else
		{
			alert ('Please select a file to delete first.');
		}
	},
	
	clipboardType : 'none',
	clipboardContents : null,
	
	cutFiles : function()
	{
		// delete button has been clicked
		type = $(this).attr('id');
		if ($("#" + type).hasClass('disabled') == false)
		{
			var dirList = interface.getJqueryDirList(interface.currentDirectory);
			var selectedList = dirList.find('.selected');
			
			interface.clipboardType = type;
			interface.clipboardContents = new Array();
			
			selectedList.each(function ()
			{
				// find the path, get rid of the trailing slash
				var path = $(this).find('.path').text().replace(/\/$/,'');
				var filename = $(this).find('.name').text();
				
				var obj = {
					oldPath : path,
					name : filename
				}
				
				interface.clipboardContents.push(obj);
			});
			
			// so we have a list of files in interface.clipboardContents
			// when paste is hit, we'll get that list, along with the new directory,
			// and send it off to our API to do the actual move.
			
			// refresh the available tools so that paste will become available
			interface.updateAvailableTools();
		}
		else
		{
			alert ('Please select a file to cut first.');
		}
	},
	
	pasteFiles : function()
	{
		var newDir = interface.currentDirectory;
		var files = interface.clipboardContents;
		
		if (interface.clipboardType == 'cut')
		{
			AjaxClient.proxy.pasteFromCut(files,newDir,interface.refreshDirectory);
		}
		else if (interface.clipboardType == 'copy')
		{
			AjaxClient.proxy.pasteFromCopy(files,newDir,interface.refreshDirectory);
		}
		
		interface.clipboardType = 'none';
	},
	
	newFolder : function()
	{
		var currentDir = interface.currentDirectory;
		var newDirName = prompt("Please enter the name of the new folder:", "New Folder");
		var path = currentDir + newDirName;
		AjaxClient.proxy.mkdir(path,interface.refreshDirectory);
	},
	
	download : function()
	{
		if ($("#download").hasClass('disabled') == false)
		{
			var dirList = interface.getJqueryDirList(interface.currentDirectory);
			var selected = dirList.find('.selected').first();
			if (selected.find('.type').text() == "file")
			{
				var path = selected.find('.path').text();
				AjaxClient.proxy.download(path,interface.cb_download);
			}
			else
			{
				alert ('Sorry, currently you can only download files, not folders.');
			}
		}
		else
		{
			//alert ('Please select a file and then try again')
		}
	},
	
	upload : function()
	{
		alert ('it seems to have changed');
	},
	
	cb_download : function(key)
	{
		document.location = "download.php?key=" + key;
	},
	
	updateAvailableTools : function()
	{
		//
		// Get data about selection
		//
		var includesFile = false;
		var includesDir = false;
		var number = 0;
		
		var dirList = interface.getJqueryDirList(interface.currentDirectory);
		var selectedList = dirList.find('.selected');
		selectedList.each(function ()
		{
			if (!includesFile) includesFile = ($(this).find('.type').text() == "file");
			if (!includesDir) includesDir = ($(this).find('.type').text() == "dir");
		});
		
		number = selectedList.length;
		
		//
		// Display info about selected files
		//
		var fileName, fileSize, fileType, fileModified, fileOwner, fileGroup, filePermissions;
		
		// if none are selected, hide the fileinfo
		if (number > 0)
		{
			$("#fileinfo").show();
		}
		else
		{
			$("#fileinfo").hide();
		}
		
		switch (number)
		{
			case 0:
				// 0 selected (show DIR info)
				$("#fileinfo").hide();
				$("#fileinfo dl").hide();
				break;
			case 1:
				// 1 selected (show FILE info)
				$("#fileinfo").show();
				$("#fileinfo dl").show();
				var item = selectedList.first();
				fileName = item.find('.name').text();
				fileSize = interface.getFriendlySize(parseFloat(fileSize = item.find('.size').text()));
				fileModified = item.find('.modified').text();
				fileType = interface.getExtension(item);
				fileOwner = item.find('.owner').text();
				fileGroup = item.find('.group').text();
				filePermissions = item.find('.permissions').text();
				
				$("#fileinfo dl dd.size").text(fileSize);
				$("#fileinfo dl dd.type").text(fileType); // not reading fileType as a string, using "" casts it as a string
				$("#fileinfo dl dd.modified").text(fileModified);
				$("#fileinfo dl dd.owner").text(fileOwner);
				$("#fileinfo dl dd.group").text(fileGroup);
				$("#fileinfo dl dd.permissions").text(filePermissions);
				$("#fileinfo #icon").attr("class",fileType);
				break;
			default:
				// multiple selected, show summary of info
				fileName = number + " files selected.";
				$("#fileinfo").show();
				$("#fileinfo dl").hide();
				$("#fileinfo #icon").attr("class","multiple");
				break;
		}
		
		$("#fileinfo h4").text(fileName);
		
		//
		// Set stuff on the toolbar
		//
		$("#rename").toggleClass('disabled', (number != 1)).toggle(number > 0);
		$("#download").toggleClass('disabled', (number != 1 || includesDir == true)).toggle(number > 0);
		$("#upload").toggle(number == 0);
		$("#delete").toggleClass('disabled', (number == 0)).toggle(number > 0);
		$("#cut").toggleClass('disabled', (number == 0));
		$("#copy").toggleClass('disabled', (number == 0 || includesDir == true));
		$("#paste").toggleClass('disabled', (interface.clipboardType == 'none'));
		$("#newFolder").toggle(number == 0);
		$("#refresh").toggle(number == 0);
		
		
	},
	
	getFriendlySize : function(num)
	{
		units = ['B', 'KB', 'MB', 'GB', 'TB'];
		var size = num;
		var currentUnit = units[0];
		for (var i = 1; (size > 1024 && i < units.length); i++)
		{
			size = size / 1024;
			currentUnit = units[i];
		}
		size = Math.round(size*10)/10;
		return String(size) + currentUnit;
	},
	
	getExtension : function(item)
	{
		type = "";
		if (item.find('.type').text() == "dir")
		{
			type = "directory";
		}
		else
		{
			var filename = item.find('.name').text();
			type = (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename) : "unknown";
		}
		// type is sometimes not a string.  Padding "" casts it into a string
		return ("" + type).toLowerCase();
	},
	
	defaultAction : function()
	{
		AjaxClient.proxy.getBrowserMask(interface.cb_addBrowserMask);
	},
	
	keepalive : function()
	{
		AjaxClient.proxy.session_keepalive();
	},
	
	cb_addBrowserMask : function(fileBrowserHtml)
	{
		interface.setContentAreaHTML(fileBrowserHtml);
		$("#backButton").click(interface.showParentDirectory);
		$("#refresh").click(interface.refreshDirectory);
		$("#rename").click(interface.renameFile);
		$("#download").click(interface.download);
		$("#delete").click(interface.deleteFiles);
		$("#cut").click(interface.cutFiles);
		$("#copy").click(interface.cutFiles);
		$("#paste").click(interface.pasteFiles);
		$("#newFolder").click(interface.newFolder);
		$("#logout").click(function () { interface.logout(); });
		
		// configure upload button
		interface.setupUploadInteraction();
		
		// done in this order on purpose, because gotoDirectory uses setBreadCrumbs to know which lists to show/hide
		interface.setBreadCrumbs(interface.currentDirectory);
		interface.gotoDirectory(interface.currentDirectory);
		
		$("#loading").click(function () { $(this).hide(); });
		$("#dirListContainer").click(function () { interface.deselectFiles(); });
	},
	
	setupUploadInteraction : function()
	{
		var button = $('#upload');
		new AjaxUpload(button, {
			action: 'upload.php', 
			name: 'userfile',
			onSubmit : function(file, ext)
			{
				// change button text, when user selects file			
				button.text('Uploading');
				
				this.setData({
					path : interface.currentDirectory
				});
				
				// If you want to allow uploading only 1 file at time,
				// you can disable upload button
				this.disable();
				
				// Uploding -> Uploading. -> Uploading...
				interval = window.setInterval(function(){
					var text = button.text();
					if (text.length < 13){
						button.text(text + '.');					
					} else {
						button.text('Uploading');				
					}
				}, 200);
			},
			onComplete: function(file, ext)
			{
				button.text('Upload');
				window.clearInterval(interval);
							
				// enable upload button
				this.enable();
				
				interface.refreshDirectory();
				
				// add file to the list
				$('<li></li>').appendTo('#example1 .files').text(file);
			}
		});
		
	},
	
	handleError : function (err)
	{
		switch (err.code)
		{
			case "SESSION.NOT_LOGGED_IN":
			case "SESSION.INCORRECT_LOGIN":
			case "SESSION.LOGGED_OUT":
			case "SESSION.TIMED_OUT":
				interface.showLoginForm({
					error : err.error,
					explanation : err.explanation,
					suggestion : err.suggestion
				});
				break;
			default:
			alert (err);
		}
	}
};

$(document).ready(function ()
	{
		AjaxClient.cnx.setErrorHandler(interface.handleError);
		interface.defaultAction();
		
		// every 2 minutes, keep the session alive
		setInterval("interface.keepalive()", 1000 * 120);
	});
