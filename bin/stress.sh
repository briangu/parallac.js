 #!/bin/bash
for i in `seq 1 1000`;
do
        node ../examples/addition
        node ../examples/addition2
        node ../examples/addition3
done
