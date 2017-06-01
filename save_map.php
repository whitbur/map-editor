<?php

$post = json_decode(file_get_contents('php://input'), true);
if ($post['password'] === 'rainbowdash') {
	file_put_contents('map.json', json_encode($post['map']));
	http_response_code(200);
} else {
	http_response_code(403);
}

?>
