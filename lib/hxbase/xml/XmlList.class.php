<?php

class hxbase_xml_XmlList extends HList {
	public function __construct($node, $list) { if(!php_Boot::$skip_constructor) {
		parent::__construct();
		if($node !== null) {
			$this->add($node);
		}
		if($list !== null) {
			if(null == $list) throw new HException('null iterable');
			$�it = $list->iterator();
			while($�it->hasNext()) {
				$n = $�it->next();
				$this->add($n);
			}
		}
	}}
	public function addList($listToAdd) {
		if(null == $listToAdd) throw new HException('null iterable');
		$�it = $listToAdd->iterator();
		while($�it->hasNext()) {
			$item = $�it->next();
			$this->add($item);
		}
		return $this;
	}
	public function filterByFunction($f) {
		$list2 = null;
		$list2 = new hxbase_xml_XmlList(null, null);
		$list2->addList(parent::filter($f));
		return $list2;
	}
	public function filterByAttribute($attName, $attValue) {
		return $this->filterByFunction(array(new _hx_lambda(array(&$attName, &$attValue), "hxbase_xml_XmlList_0"), 'execute'));
	}
	public function filterByTagName($tagName) {
		return $this->filterByFunction(array(new _hx_lambda(array(&$tagName), "hxbase_xml_XmlList_1"), 'execute'));
	}
	public function getAt($index) {
		$iter = null;
		$xml = null;
		$i = null;
		$iter = $this->iterator();
		$xml = null;
		$i = 1;
		while($i <= $index && $iter->hasNext()) {
			if($i === $index) {
				$xml = $iter->next();
			} else {
				$iter->next();
			}
			$i++;
		}
		return $xml;
	}
	public function indexOf($childToSearchFor) {
		$iter = null;
		$foundItem = null;
		$itemIndex = null;
		$i = null;
		$i = 0;
		$itemIndex = 0;
		$foundItem = false;
		$iter = $this->iterator();
		while($itemIndex === 0 && $iter->hasNext()) {
			$i++;
			$currentChild = $iter->next();
			if($currentChild->getter_xml() === $childToSearchFor->getter_xml()) { $itemIndex = $i; }
			unset($currentChild);
		}
		return $itemIndex;
	}
	public function toString() {
		$s = new StringBuf();
		if(null == $this) throw new HException('null iterable');
		$�it = $this->iterator();
		while($�it->hasNext()) {
			$child = $�it->next();
			$x = $child->toString();
			if(is_null($x)) {
				$x = "null";
			} else {
				if(is_bool($x)) {
					$x = (($x) ? "true" : "false");
				}
			}
			$s->b .= $x;
			unset($x);
		}
		return $s->b;
	}
	function __toString() { return $this->toString(); }
}
function hxbase_xml_XmlList_0(&$attName, &$attValue, $n) {
	{
		return $n->testIsElement() && $n->hasAtt($attName) && $n->getAtt($attName) === $attValue;
	}
}
function hxbase_xml_XmlList_1(&$tagName, $n) {
	{
		return $n->testIsElement() && $n->getter_name() === $tagName;
	}
}
