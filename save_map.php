<?php

# Honestly, this is not very secure. Try not to rely on this.
$post = json_decode(file_get_contents('php://input'), true);
if ($post['password'] === trim(file_get_contents('password'))) {
	file_put_contents('map.json', json_encode($post['map']));
	http_response_code(200);
} else {
	http_response_code(403);
}

?>
