# dialogue.md

The lines over the dialogue strip, in both halves of the game: the name on the bubble, then the cast, then every customer's own lines. There are no shared lines (owner, 2026-11-09): each customer says only their own, at each of 13 moments, and the build refuses a customer with nothing to say at one. The game reads `content/dialogue.json`: that file is the master copy and this page mirrors it, so edit the lines in Service Mode or in the JSON.

## I. The speaker

The name on every customer's speech bubble.

### Who

The name on the speech bubble.

1. "CUSTOMER"

## II. The cast

The officers, rivals and coworkers who speak at their own moments. Their lines carry no era.

### SGT. PFEIFER

Officer, 1970s (key pfeifer, face cop70).

#### Chase

The cruiser is on the player.

1. "PULL IT OVER, TACO BOY."
2. "THIS IS HAYS PD. PULL OVER!"
3. "LIGHTS AND SIREN. YOUR MOVE, SON."
4. "I'VE GOT YOU ON THE RADAR, SON."
5. "YOU'RE NOT IN DODGE CITY NOW!"

#### Fined

The player was fined.

1. "THAT'S A CITATION, SON."
2. "SIGN HERE. PRESS HARD. 3 COPIES."
3. "SPEED LIMIT'S 25 FOR A REASON."
4. "THAT'S COMING OUT OF YOUR TIPS."
5. "I'LL BE TELLING YOUR MOTHER."

#### Lost

The player lost the cruiser.

1. "I KNOW WHERE YOU WORK, SON."
2. "THIS ISN'T OVER, TACO BOY."
3. "I'LL BE IN FOR LUNCH. WATCH IT."
4. "LOST HIM BY THE GRAIN ELEVATOR."
5. "NEXT TIME, SON. NEXT TIME."

### OFC. KARLIN

Officer, 1980s (key karlin, face cop80).

#### Chase

The cruiser is on the player.

1. "DISPATCH, I'VE GOT A TACO RUNNER."
2. "OH, YOU WANT TO DO THIS? OKAY."
3. "PULL OVER. DON'T MAKE ME RADIO."
4. "NICE CAR. SHAME ABOUT THE DRIVER."
5. "CODE 3 ON A TACO RUN. GREAT."

#### Fined

The player was fined.

1. "LICENSE, REGISTRATION, SALSA."
2. "THAT'LL COST YOU. AND ME A TACO."
3. "TICKET'S IN THE MAIL. SMILE."
4. "YOU'RE KEEPING ME IN BUSINESS."
5. "WRITE THAT DOWN? ALREADY DID."

#### Lost

The player lost the cruiser.

1. "OKAY. YOU WIN THIS ONE."
2. "I'LL SEE YOU AT LUNCH, HOTSHOT."
3. "DISPATCH, LOST 'EM. AGAIN."
4. "RUN ALL YOU WANT. I'M HUNGRY."
5. "ENJOY IT. I HAVE YOUR PLATES."

### OFC. DREILING

Officer, 1990s (key dreiling, face cop90).

#### Chase

The cruiser is on the player.

1. "OKAY. ONE. TWO. PULL OVER."
2. "SIR? MA'AM? PLEASE PULL OVER."
3. "I JUST WASHED THIS CRUISER, MAN."
4. "NOT HOW I PICTURED MY SHIFT."
5. "STOP! I MEAN IT! I THINK!"

#### Fined

The player was fined.

1. "I HAVE TO WRITE THIS. SORRY."
2. "MY SERGEANT MAKES ME DO THIS."
3. "THAT'S A TICKET. DON'T HATE ME."
4. "THREE, TWO... TICKET. WHATEVER."
5. "IT'S NOT PERSONAL. IT'S A QUOTA."

#### Lost

The player lost the cruiser.

1. "AND... THEY'RE GONE. GREAT."
2. "I'M TELLING SARGE IT WAS FOG."
3. "WHATEVER. I'M ON BREAK ANYWAY."
4. "THAT DIDN'T HAPPEN. OKAY?"
5. "PAGE ME IF YOU SEE 'EM."

### DUSTY

Rival, 1970s (key dusty, face rival70).

#### Missed

A rival sees the bag miss.

1. "NICE ARM. FOR A LAWN SPRINKLER."
2. "HA! RIGHT IN THE PETUNIAS, MAN!"
3. "WATCH AND LEARN, ROOKIE."
4. "SMOOTH. REAL SMOOTH. FAR OUT."
5. "THAT ONE'S GOING IN MY SCRAPBOOK."

#### Perfect

A rival sees a perfect toss.

1. "LUCKY. TOTALLY LUCKY."
2. "OKAY, THAT WAS KINDA GROOVY."
3. "I TAUGHT YOU THAT. DON'T FORGET."
4. "RIGHT ON THE MAT? NO WAY, MAN."
5. "ENJOY IT. WON'T HAPPEN AGAIN."

### ACE

Rival, 1980s (key ace, face rival80).

#### Missed

A rival sees the bag miss.

1. "GAME OVER, MAN! INSERT COIN!"
2. "HA! YOU MISSED BY A COUNTY!"
3. "NEW HIGH SCORE... FOR MISSING!"
4. "THAT'S NOT HOW YOU PLAY, ROOKIE."
5. "EVEN MY KID BROTHER HITS THAT."

#### Perfect

A rival sees a perfect toss.

1. "BONUS ROUND! ...LUCKY."
2. "OKAY, OKAY. THAT'S A HIGH SCORE."
3. "NICE. STILL NOT MY INITIALS."
4. "WHOA. RADICAL. I MEAN, WHATEVER."
5. "YOU'VE BEEN PRACTICING. ADMIT IT."

### JINX

Rival, 1990s (key jinx, face rival90).

#### Missed

A rival sees the bag miss.

1. "AS IF! THAT WAS SO NOT IT."
2. "WHOOPS. I SAW NOTHING. WINK."
3. "THAT'S GOING IN MY ZINE."
4. "TALK TO THE HAND. AND THE HEDGE."
5. "NOT EVEN CLOSE. NOT EVEN!"

#### Perfect

A rival sees a perfect toss.

1. "OKAY, THAT WAS ALL THAT."
2. "WHATEVER. I'LL DO IT BETTER."
3. "DID YOU JUST... PSH. LUCKY."
4. "SCHWING. I MEAN, FINE. GOOD."
5. "DON'T LET IT GO TO YOUR HEAD."

### MARGE

Coworker, 1970s (key marge, face staff70).

#### Hint

Kitchen: the next ingredient to pick. {ING} is its plate name.

1. "{ING} NEXT, HON."
2. "DON'T FORGET THE {ING}, SUGAR."
3. "{ING}. TRUST ME, HON."
4. "YOU WANT THE {ING} NOW."
5. "{ING} GOES ON NEXT, DEAR."

#### Clockin

Kitchen: the shift starts.

1. "APRON ON, HON. HERE THEY COME."
2. "COFFEE'S ON. LET'S ROLL, SUGAR."
3. "LUNCH RUSH. KEEP UP, HON."
4. "I'VE DONE THIS SINCE '62. WATCH."
5. "TICKETS ON THE RAIL. GET MOVING."

#### Streak

Kitchen: a run of clean tickets.

1. "NOW YOU'RE COOKING, HON!"
2. "LOOK AT YOU GO, SUGAR!"
3. "WELL, AREN'T YOU SOMETHING."
4. "KEEP THAT UP AND I'LL RETIRE."
5. "THAT'S HOW WE DO IT AT THE SHOP."

#### Trouble

Kitchen: the line is backing up.

1. "HON, THE LINE'S OUT THE DOOR!"
2. "CLOCK'S RUNNING, SUGAR. HUSTLE!"
3. "THEY'RE GETTING CRANKY OUT THERE."
4. "PICK UP THE PACE, HON. NOW."
5. "I'VE SEEN SNAILS WITH MORE PEP."

### DALE

Coworker, 1980s (key dale, face staff80).

#### Hint

Kitchen: the next ingredient to pick. {ING} is its plate name.

1. "PSST. {ING} NEXT, BUDDY."
2. "I THINK IT'S {ING}. YEAH."
3. "GO {ING}, DUDE. TRUST ME."
4. "IT'S {ING} TIME, PAL."
5. "{ING} GOES NEXT. TOTALLY."

#### Clockin

Kitchen: the shift starts.

1. "OKAY! RUSH HOUR! LET'S DO THIS!"
2. "I MADE A MIXTAPE FOR THE SHIFT."
3. "HAIRNETS ON, PEOPLE. GO TIME."
4. "BIG CROWD TODAY. WE GOT THIS."
5. "SHIFT'S ON! HIGH FIVE! ...NO?"

#### Streak

Kitchen: a run of clean tickets.

1. "TOTALLY TUBULAR, BUDDY!"
2. "YOU'RE ON FIRE! NOT LITERALLY."
3. "THAT'S A COMBO! LIKE IN ARCADES!"
4. "WHOA. YOU'RE A NATURAL, DUDE."
5. "RADICAL! KEEP 'EM COMING!"

#### Trouble

Kitchen: the line is backing up.

1. "UH, DUDE? THE LINE'S HUGE."
2. "CLOCK! CLOCK! WATCH THE CLOCK!"
3. "THEY'RE STARTING TO CHANT, MAN."
4. "I DON'T WANNA PANIC, BUT... PANIC."
5. "WE ARE SO GETTING GROUNDED."

### NIKKI

Coworker, 1990s (key nikki, face staff90).

#### Hint

Kitchen: the next ingredient to pick. {ING} is its plate name.

1. "{ING}. DUH."
2. "HELLO? {ING} GOES NEXT."
3. "{ING}. NOT ROCKET SCIENCE."
4. "THE {ING}, GENIUS."
5. "TRY {ING}. JUST SAYING."

#### Clockin

Kitchen: the shift starts.

1. "OKAY, CREW. NO DRAMA TODAY."
2. "SPATULA UP. LET'S DO THIS."
3. "THEY'RE LINING UP. GAME FACE."
4. "LUNCH RUSH. I'M SO READY. NOT."
5. "CLOCK'S ON. MAKE IT SNAPPY."

#### Streak

Kitchen: a run of clean tickets.

1. "OKAY, YOU'RE KIND OF AWESOME."
2. "BOO-YAH! CLEAN TICKET!"
3. "ALL THAT AND A BAG OF CHIPS!"
4. "WHO ARE YOU AND WHAT DID YOU DO?"
5. "YOU'RE BUGGIN'. IN A GOOD WAY."

#### Trouble

Kitchen: the line is backing up.

1. "UM, THE LINE? IT'S A WHOLE THING."
2. "CLOCK'S DYING. MOVE IT, MOVE IT."
3. "THEY'RE GONNA RIOT. JUST SAYING."
4. "THIS IS SO NOT GOOD. LIKE, AT ALL."
5. "HURRY. I CAN'T HANDLE THE WHINING."

## III. Customers

Every customer's own lines, at each of the 13 moments. A customer says only these.

### c70bellbottom



#### Delivered

Delivery Shift: the order arrived in good time.

1. "OH, BLESS YOU! THE CASSEROLE CAN WAIT."
2. "RIGHT ON TIME. I MAY NOT EVEN YELL TODAY."
3. "THE KIDS ARE QUIET FOR ONCE. BLESS YOU, SUGAR."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! I CAN'T GET MY BOYS TO AIM THAT GOOD."
2. "RIGHT ON THE MAT! MARRY MY SISTER, SUGAR."
3. "OH MY STARS, ON THE WELCOME MAT! I COULD KISS YOU."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "THE KIDS ATE THE CRAYONS WAITING, SUGAR. THE CRAYONS!"
2. "COLD AS MY HUSBAND, AND TWICE AS LATE."
3. "I HAD THREE KIDS FASTER THAN THIS ORDER CAME."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE ROSEBUSH?! DON'T MAKE ME COME DOWN THESE STEPS!"
2. "MY TODDLER THROWS BETTER THAN THAT. MOSTLY STRAINED PEAS."
3. "THAT WAS DINNER FOR FIVE, YOU BUTTERFINGERED NITWIT!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "I'VE GOT GROCERIES AND A HEADACHE, YOU JACKASS!"
2. "SLOW DOWN! I DIDN'T SURVIVE THREE LABORS FOR THIS!"
3. "YOU COME BACK HERE AND APOLOGIZE, MISTER! MISTER!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY STATION WAGON! WITH ALL THREE CAR SEATS IN IT!"
2. "YOU DENTED MY WOOD PANELING, YOU SON OF A- SUGAR!"
3. "MY HUSBAND IS GOING TO THINK I DID THIS. YOU'RE DEAD."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "THREE KIDS IN THE CAR. MAKE IT SNAPPY, SUGAR!"
2. "ONE SOFT TACO, AND DON'T MAKE ME ASK TWICE."
3. "TWO NACHOS AND A SEDATIVE, SUGAR. KIDDING. MOSTLY."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I HAVE A CASSEROLE IN THE OVEN AT HOME, YOUNG MAN!"
2. "OH, SUGAR, I HAVE HALF A MIND TO..."
3. "IF YOU MAKE ME USE MY MOM VOICE, YOU WILL REGRET IT!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "MOMMY NEEDS HER TACO. MOMMY NEEDS HER TACO."
2. "I LEFT THE KIDS WITH THEIR FATHER. THE HOUSE MAY BE ON FIRE."
3. "THIS LINE IS LONGER THAN MY LAST LABOR, AND THAT WAS A DOOZY."

#### Wrong

Kitchen Shift: a wrong pick.

1. "OH. OH. WELL. THAT'S... DIFFERENT."
2. "I WILL SEND THAT BACK SO FAST YOUR HEAD SPINS, SUGAR."
3. "NOT WHAT I ORDERED, AND I'M TOO TIRED TO BE NICE ABOUT IT."

#### Served

Kitchen Shift: a ticket was served.

1. "NOW THAT'S HOW MOMMY LIKES IT, SUGAR."
2. "PERFECT. I'M TELLING ALL THE PTA MOMS."
3. "THE FIRST THING TODAY THAT WENT RIGHT. THANK YOU, SUGAR."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "THAT FAST? HONEY, YOU'RE QUICKER THAN MY HUSBAND."
2. "FAST AND PERFECT! YOU'RE GOING IN MY CHRISTMAS LETTER."
3. "SUGAR, YOU JUST MADE MOMMY'S WHOLE WEEK."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M GONNA EAT AT TACO BELL AND I'M GONNA ENJOY IT!"
2. "I'M GOING HOME TO A CASSEROLE AND A LARGE GLASS OF WINE."
3. "MOMMY IS LEAVING. MOMMY IS NOT COMING BACK."

### c70leisure



#### Delivered

Delivery Shift: the order arrived in good time.

1. "HALLELUJAH! IT CAME, AND IT CAME HOT!"
2. "NOT BAD. NEARLY TEXAS-SIZED, EVEN."
3. "THAT'S A CLOSER, SON. I COULD SELL A MAN LIKE YOU."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "SWEET MERCIFUL MOTHER, RIGHT ON THE MAT! PRAISE BE!"
2. "SON, YOU COULD SELL SAND IN AMARILLO WITH THAT ARM."
3. "DEAD CENTER! I'D HIRE YOU, BUT YOU'D SHOW ME UP."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "I'VE CLOSED THREE DEALS AND A DIVORCE SINCE I ORDERED!"
2. "COLD BEANS? IN TEXAS WE'D RUN YOU OUT OF TOWN!"
3. "THIS TACO'S DEADER THAN MY QUOTA, YOU JACKASS."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "WHY I OUGHTA - OH! OH I OUGHTA!"
2. "IN THE PETUNIAS?! YOU WOULDN'T LAST A DAY IN SALES!"
3. "SON, I'LL PRAY FOR YOU. THEN I'LL SUE YOU."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT! THIS SUIT IS A HUNDRED PERCENT POLYESTER!"
2. "JUMPING JEHOSHAPHAT, I NEARLY MET MY MAKER!"
3. "YOU NEARLY CREASED MY SLACKS, YOU HIGHWAY HOOLIGAN!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY LINCOLN! YOU JUST DENTED MY ENTIRE PERSONALITY!"
2. "THAT'S A COMPANY CAR, SON! I'LL HAVE YOUR HIDE!"
3. "I'LL SUE YOU SO HARD YOUR GRANDKIDS PAY ME!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "CAN I GET A HALLELUJAH FOR A FAST TACO?!"
2. "GIVE ME THE BIGGEST BURRITO YOU GOT, FRIEND!"
3. "SALES MEETING AT ONE. HOP TO IT!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "WE DO TACOS BIGGER IN TEXAS!"
2. "I'VE MADE SALES CALLS SHORTER THAN THIS, PARTNER."
3. "I'M SWEATING CLEAN THROUGH MY LEISURE SUIT, FRIEND!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "BROTHERS AND SISTERS, WE ARE LOST IN THE WILDERNESS!"
2. "I COULD'VE SOLD A WHOLE FLEET OF CARS IN THIS LINE!"
3. "IN TEXAS THIS LINE'D HAVE ITS OWN ZIP CODE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU SHMUCK ON TOAST!"
2. "WHAT A LOAD OF UTTER ROT!"
3. "SON, THAT ORDER'S WRONGER THAN A SNAKE IN BOOTS!"

#### Served

Kitchen Shift: a ticket was served.

1. "NOW THAT IS A TACO A MAN CAN TESTIFY TO!"
2. "I'D SAY FORGET ABOUT IT, BUT I WON'T."
3. "NOW THAT'S A PRODUCT I COULD SELL, FRIEND!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "HALLELUJAH! I HAVE SEEN THE LIGHT AND IT'S A BURRITO!"
2. "SON, THAT WAS FASTER THAN A TEXAS BAR FIGHT!"
3. "COOK OF THE MONTH! I'D PUT YOUR PICTURE UP MYSELF!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "FORGET ABOUT IT. I SAID FORGET ABOUT IT."
2. "I'M TAKING MY EXPENSE ACCOUNT ELSEWHERE, FRIEND!"
3. "YOU JUST LOST A CUSTOMER FOR LIFE, YOU SHMUCK!"

### c70longhair



#### Delivered

Delivery Shift: the order arrived in good time.

1. "WELL NOW, PARTNER, THAT'S MIGHTY QUICK."
2. "I DIDN'T EVEN HAVE TIME TO AGE. THANKS!"
3. "RIGHT ON TIME, PARTNER. MY FOREMAN WON'T BELIEVE IT."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER, PARTNER! YOU COULD LAY BRICK WITH THAT AIM."
2. "SQUARE AND PLUMB! I'D HIRE YOU ON THE CREW."
3. "WELL, BUST MY HARD HAT, RIGHT ON THE MAT!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "PARTNER, MY CONCRETE SET FASTER THAN THIS SHOWED UP."
2. "COLD AS A STEEL BEAM IN JANUARY, YOU SLOWPOKE."
3. "MY FOREMAN'S GONNA SKIN ME, AND MY TACO'S COLD."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE GUTTER?! I HUNG THAT GUTTER, YOU JACKASS!"
2. "YOU THROW LIKE A WET BAG OF CEMENT, PARTNER!"
3. "ON THE ROOF?! NOW I GOTTA GET THE LADDER OFF THE TRUCK!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HEY! I'M WEARING A HARD HAT, NOT A FORCE FIELD!"
2. "WATCH IT! YOU NEARLY POURED ME INTO THE SIDEWALK!"
3. "SLOW DOWN, PARTNER! I GOT A WIFE AND A PICKUP PAYMENT!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY PICKUP! THAT'S THE ONLY THING I OWN OUTRIGHT!"
2. "YOU DENTED MY TAILGATE, YOU GREASY LITTLE WEASEL!"
3. "NOW I REALLY NEED THAT ATTORNEY, PARTNER!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I GOT A JACKHAMMER WAITING FOR ME!"
2. "LUNCH WHISTLE BLEW. BEAN BURRITO, PRONTO!"
3. "MY FOREMAN GAVE ME TWENTY MINUTES, PARTNER."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I HAVE AGED BIBLICALLY WAITING FOR THIS!"
2. "I'M ABOUT TO LOSE IT, PARTNER!"
3. "I CAN HEAR MY FOREMAN CUSSING FROM HERE, PARTNER!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE'S SLOWER THAN A CITY ROAD CREW, AND I'M ON ONE."
2. "I COULD FRAME A WHOLE HOUSE IN THE TIME THIS LINE TOOK."
3. "PARTNER, MY HAIR'S GROWN TWO INCHES IN THIS LINE."

#### Wrong

Kitchen Shift: a wrong pick.

1. "THAT AIN'T MY BURRITO, PARTNER. THAT AIN'T EVEN CLOSE."
2. "WHO TAUGHT YOU TO COOK, A BACKHOE?"
3. "MEASURE TWICE, CUT ONCE, YOU KNUCKLEHEAD!"

#### Served

Kitchen Shift: a ticket was served.

1. "I CAME IN HUNGRY AND I LEAVE AT PEACE."
2. "CALL OFF MY ATTORNEY. ONCE I GET ONE."
3. "THAT'S A BURRITO A MAN CAN SWING A HAMMER ON."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FAST AND PERFECT? PARTNER, YOU'RE WASTED IN HERE."
2. "I GOT TEN MINUTES OF LUNCH LEFT! I COULD KISS YOU!"
3. "BUILT TO CODE AND AHEAD OF SCHEDULE! NEVER SEEN IT!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "YOU WILL HEAR FROM MY ATTORNEY! ...AS SOON AS I GET ONE!"
2. "NAMA-STAY OUT OF MY WAY, I'M LEAVING!"
3. "LUNCH IS OVER, PARTNER, AND SO ARE WE!"

### c70teacher



#### Delivered

Delivery Shift: the order arrived in good time.

1. "WELL. PUNCTUAL. I'LL MAKE A NOTE OF IT."
2. "GOLD STAR, YOUNG MAN. GOLD STAR."
3. "ON TIME AND ON THE PORCH. SEE? IT ISN'T HARD."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "A+, YOUNG MAN. I'LL BE TELLING YOUR MOTHER."
2. "DEAD CENTER. YOU MAY HAVE A HALL PASS FOR LIFE."
3. "NOW WHY CAN'T YOU DO THAT WITH LONG DIVISION?"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "TARDY. THAT IS A DETENTION, YOUNG MAN."
2. "COLD. I'M DOCKING YOU A FULL LETTER GRADE."
3. "THE CLASS HAMSTER WOULD HAVE BEEN FASTER, YOUNG MAN."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE HEDGE. SEE ME AFTER CLASS, YOU LITTLE HOOLIGAN."
2. "THAT IS GOING ON YOUR PERMANENT RECORD, YOUNG MAN!"
3. "PICK THAT UP THIS INSTANT. I AM COUNTING TO THREE."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "YOU NEARLY HIT ME! I KNOW YOUR MOTHER, YOU KNOW!"
2. "SLOW DOWN! I HAVE THIRTY ESSAYS AND ONE NERVE LEFT!"
3. "I TAUGHT YOU TO LOOK BOTH WAYS! I TAUGHT YOU THAT!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY RAMBLER! ON A TEACHER'S SALARY, YOU LITTLE JACKASS!"
2. "WHO TAUGHT YOU TO DRIVE? NOT ME. I'D HAVE FAILED YOU."
3. "I'M WRITING YOUR NAME ON THE BOARD, YOUNG MAN. IN RED."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I HAVE PAPERS TO GRADE. ONE TACO, PLEASE."
2. "RECESS ENDS IN TEN MINUTES. CHOP CHOP."
3. "ONE BEAN BURRITO, AND I WILL BE TIMING YOU."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I'M WAITING. I CAN WAIT ALL DAY. I DO IT FOR A LIVING."
2. "EYES ON YOUR OWN WORK AND HANDS ON MY TACO, PLEASE!"
3. "DO I NEED TO SEND THE PRINCIPAL BACK THERE?!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "EXCUSE ME. EXCUSE ME. CAN I HAVE YOUR ATTENTION PLEASE?!"
2. "I AM REBUKING THIS WAIT TIME IN THE NAME OF ALL THAT IS HOLY!"
3. "THIS LINE HAS LESS DISCIPLINE THAN MY FOURTH PERIOD."

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOUR FATHER WOULD BE ASHAMED!"
2. "I'LL BE HAVING A STERN WORD WITH YOUR MOTHER, YOUNG MAN!"
3. "WRONG. SHOW YOUR WORK, YOUNG MAN. SHOW. YOUR. WORK."

#### Served

Kitchen Shift: a ticket was served.

1. "A+ FOR PRESENTATION, YOUNG MAN."
2. "MY BOOK CLUB WILL HEAR ABOUT THIS. NICELY."
3. "VERY GOOD. YOU MAY GO TO RECESS."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS! YOU'RE GOING UP ON THE BULLETIN BOARD!"
2. "FAST AND CORRECT! HONOR ROLL, YOUNG MAN!"
3. "WELL, I'LL BE DAMNED. PARDON MY LANGUAGE. BRAVO."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M CALLING THE BETTER BUSINESS BUREAU!"
2. "I'LL BE ADDRESSING THIS IN MY BOOK CLUB."
3. "CLASS DISMISSED. PERMANENTLY."

### c70trucker



#### Delivered

Delivery Shift: the order arrived in good time.

1. "THAT'S A BIG TEN-FOUR ON A HOT TACO!"
2. "YOU DRIVE LIKE YOU GOT A LOAD DUE IN OMAHA."
3. "BRING IT ON HOME, GOOD BUDDY. RIGHT ON THE DOT."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "BREAKER BREAKER, WE GOT A BULLSEYE ON THE PORCH!"
2. "THREADED IT LIKE A DOUBLE-WIDE THROUGH A TOLLBOOTH!"
3. "DEAD CENTER! I'D LET YOU BACK MY RIG IN, GOOD BUDDY."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "THERE'S A HEARTBREAK IN EVERY COUNTRY SONG - THIS IS MINE!"
2. "I'VE HAULED HOGS TO DENVER QUICKER THAN THIS, SLOWPOKE."
3. "COLD AS A TRUCK-STOP SHOWER, AND TWICE AS DISAPPOINTING."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE DITCH! YOU THROW LIKE A JACKKNIFED TRAILER!"
2. "MAYDAY, MAYDAY! TACO DOWN IN THE WEEDS!"
3. "I'VE SEEN BETTER AIM IN A TRUCK-STOP BATHROOM, BUDDY!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "BREAKER ONE-NINE, WE GOT A MANIAC ON THE LOOSE!"
2. "WATCH IT! I'M BIGGER THAN YOUR CAR, AND MEANER!"
3. "LEARN YOUR LANE, YOU FOUR-WHEELER FLEA!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YOU DINGED MY RIG, YOU FOUR-WHEELER! I'LL PANCAKE YOU!"
2. "THAT'S MY CHROME, YOU SON OF A- GOOD BUDDY!"
3. "SMOKEY'S GONNA HEAR ABOUT THIS ON CHANNEL NINETEEN!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "GOT A RIG FULL OF CATTLE. MAKE IT QUICK!"
2. "THREE COMBO BURRITOS FOR THE ROAD, BUDDY."
3. "HOT COFFEE AND A HARD TACO. I GOT 400 MILES TO GO."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "WHEN I WAS YOUR AGE, I HAD THREE JOBS AND A MORTGAGE!"
2. "THIS IS A TEN-FOUR ON A SLOW TACO, GOOD BUDDY!"
3. "LOOK. I HAVE A DAUGHTER. YOU CAN DATE HER. JUST GIVE ME THE TACO."

#### Queue

Kitchen Shift: the line is past three customers.

1. "WEIGH STATIONS MOVE QUICKER!"
2. "THIS LINE'S BACKED UP WORSE THAN I-70 AT SALINA!"
3. "I'M BURNING DAYLIGHT AND DIESEL IN HERE, PEOPLE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU SALSA-FINGERED FENCEPOST!"
2. "WHAT KIND OF TRUCK-STOP OPERATION IS THIS?!"
3. "THAT AIN'T WHAT I ORDERED, YOU GREASE-TRAP GREMLIN!"

#### Served

Kitchen Shift: a ticket was served.

1. "NOW THAT'S A TRUCK-STOP TACO DONE RIGHT."
2. "WORTH GETTING OFF I-70 FOR, GOOD BUDDY."
3. "THAT'LL KEEP ME TRUCKIN' TO DENVER, GOOD BUDDY."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "CLEAN RUN AND NO SMOKEY IN SIGHT! WAHOO!"
2. "FASTEST STOP ON I-70! I'M TELLING THE WHOLE CB!"
3. "YOU JUST PUT ME BACK ON SCHEDULE. I COULD KISS YOU, BUDDY."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "BREAKER ONE-NINE, I'M LEAVIN' YOUR PARKING LOT! OVER AND OUT!"
2. "CONVOY OF ONE, OVER AND OUT!"
3. "I'M HAULING MY HUNGRY CARCASS TO THE NEXT EXIT!"

### c70waitress



#### Delivered

Delivery Shift: the order arrived in good time.

1. "HEAVENS, STILL WARM! YOU'RE A DEAR."
2. "MY BRIDGE CLUB WILL BE SO JEALOUS, HONEY."
3. "STILL HOT! LIKE MY SECOND HUSBAND, GOD REST HIM."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "RIGHT ON THE MAT! YOU'VE GOT GOOD HANDS, DEAR. I NOTICE HANDS."
2. "OH MY! NOT SINCE THE NAVY BOYS IN '44 HAVE I SEEN AIM LIKE THAT."
3. "DEAD CENTER! I HAVEN'T BLUSHED LIKE THIS SINCE V-J DAY."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "MY HUSBAND WOULD HAVE A WORD WITH YOU, IF HE WERE STILL ALIVE!"
2. "COLD AND LIMP. LIKE MY FIRST HUSBAND, HEAVEN KNOWS."
3. "I'VE OUTLIVED TWO HUSBANDS WAITING FOR THIS, DEAR."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "MY NEPHEW IS A LAWYER AND HE'LL BE HEARING ABOUT THIS!"
2. "IN MY BUSHES? NOBODY'S BEEN IN MY BUSHES SINCE 1958!"
3. "YOU MISSED, DEAR. MEN ALWAYS DO. I'M USED TO IT."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT! I'M SAVING THIS NEW HIP FOR SATURDAY NIGHT!"
2. "YOU NEARLY BLEW MY GIRDLE CLEAN OFF, YOU MANIAC!"
3. "I'M GOING OUT IN BED WITH A SMILE, NOT UNDER YOUR TIRES!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY BUICK! I LOST MY VIRTUE IN THAT BACK SEAT!"
2. "NOBODY TOUCHES MY BUMPER UNINVITED, YOUNG MAN!"
3. "MY NEPHEW THE LAWYER WILL HAVE YOU FOR BREAKFAST, DEAR!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "BRIDGE STARTS AT TWO, DEAR. HURRY ALONG."
2. "A SOFT TACO, AND SOMETHING FOR MY SISTER."
3. "ONE BEEF BURRITO, DEAR. THE BIGGEST. I LIKE A HANDFUL."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "LORD HAVE MERCY ON THIS SLOW KITCHEN!"
2. "I HAVEN'T SLEPT IN SIX YEARS, DO NOT TEST ME!"
3. "THIRTY YEARS WAITING TABLES, I NEVER KEPT A MAN THIS LONG!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THE MAN BEHIND ME IS STANDING VERY CLOSE. I'M NOT COMPLAINING."
2. "AT MY AGE I DON'T BUY GREEN BANANAS, DEAR. HURRY THIS LINE."
3. "ALL OF US PRESSED TOGETHER LIKE A USO DANCE. HOW THRILLING."

#### Wrong

Kitchen Shift: a wrong pick.

1. "HEAVENS TO BETSY!"
2. "WE DON'T DO THAT WHERE I'M FROM. WE JUST DON'T."
3. "WRONG ONE, DEAR. I ORDERED THE BIG ONE. I ALWAYS GET THE BIG ONE."

#### Served

Kitchen Shift: a ticket was served.

1. "NOW THAT'S A KITCHEN I CAN BE PROUD OF."
2. "I WAITED TABLES THIRTY YEARS. THAT'S RIGHT."
3. "MMM. I HAVEN'T BEEN THIS SATISFIED SINCE EISENHOWER."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "QUICK AND PERFECT! MEN ARE USUALLY ONLY ONE OR THE OTHER."
2. "BRAVO! IF I WERE FORTY YEARS YOUNGER, DEAR. OR THIRTY."
3. "I'M SO TICKLED I MAY NEED TO SIT DOWN AND FAN MYSELF!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I LEFT MY BRIDGE CLUB FOR THIS DISASTER!"
2. "MEN HAVE KEPT ME WAITING BEFORE, DEAR. NEVER TWICE."
3. "MY BRIDGE CLUB WILL HEAR ALL ABOUT YOUR SLOW HANDS!"

### c70discoking



#### Delivered

Delivery Shift: the order arrived in good time.

1. "SOLD! TO THE DRIVER WITH THE GOOD ARM!"
2. "THE STARS FORETOLD THIS. HOT AND ON TIME."
3. "RIGHT ON TIME! I SHALL DANCE TONIGHT, BABY!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "SOLD! SOLD! SOLD! TO THE DRIVER WITH THE GOLDEN WRIST!"
2. "THE STARS SAID A STRANGER WOULD SWEEP ME OFF MY FEET. YOU DID!"
3. "ON THE MAT! THE MOST GLAMOROUS THING I'VE SEEN ALL DAY!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "MY MERCURY IS IN RETROGRADE AND SO ARE YOU!"
2. "COLD? DO I LOOK LIKE A MAN WHO EATS COLD? LOOK AT ME!"
3. "GOING ONCE, GOING TWICE... GONE COLD. YOU SLOWPOKE!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "MOTHER OF MERCY!"
2. "I'M NOT CLIMBING THAT HEDGE IN PLATFORMS, YOU TURKEY!"
3. "THAT TOSS WAS A CRIME AGAINST MY HOROSCOPE!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH THE HAIR! WATCH THE HAIR! THAT TOOK AN HOUR!"
2. "YOU NEARLY RAN DOWN A SAGITTARIUS, YOU BRUTE!"
3. "MY PLATFORMS! I CAN'T RUN IN THESE, YOU MANIAC!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY TRANS AM! SHE'S A SCORPIO, SHE'LL NEVER FORGIVE YOU!"
2. "SOLD! ONE BUMPER, TO THE IDIOT IN THE TACO CAR!"
3. "YOU SCRATCHED MY GOLD PAINT, YOU POLYESTER PEASANT!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "DO I HEAR TWO TACOS? I DO! I DO!"
2. "MAKE IT FABULOUS. I HAVE AN ENTRANCE TO MAKE."
3. "SOFT TACO SUPREME, BABY. SUPREME IS MY MIDDLE NAME."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "GOING ONCE! GOING TWICE! GOING... OUT OF MY MIND!"
2. "THE DISCO OPENS AT NINE AND I'M AGING HERE, BABY!"
3. "IS SATURN IN THE KITCHEN? WHY IS EVERYTHING SO SLOW?!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE HAS NO RHYTHM. NO RHYTHM AT ALL!"
2. "DO I HEAR TEN DOLLARS TO CUT? TEN? DO I HEAR TEN?!"
3. "I DIDN'T WEAR THIS MUCH COLOGNE TO STAND IN A LINE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "NO NO NO! THAT'S NOT SUPREME! THAT'S BARELY ADEQUATE!"
2. "WRONG! THE STARS WARNED ME ABOUT A COOK LIKE YOU!"
3. "I WOULDN'T BID A NICKEL ON THAT TACO, BABY!"

#### Served

Kitchen Shift: a ticket was served.

1. "YOUR SECRET RECIPE WILL BE MINE!"
2. "MAGNIFICENT. I STILL WANT THAT RECIPE."
3. "THE PLANETS ALIGN, AND SO DOES THIS TACO."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "SOLD TO THE COOK, FOR A STANDING OVATION! MAGNIFICENT!"
2. "FAST AND FABULOUS! YOU'RE COMING DANCING WITH ME TONIGHT!"
3. "THE COSMOS WEPT! I WEPT! IT'S FLAWLESS, BABY!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I CAME IN GOOD FAITH. I CAME IN GOOD FAITH!"
2. "SOLD! TO THE GENTLEMAN... GOING TO TACO BELL INSTEAD!"
3. "I'M TAKING MY GLITTER AND MY MONEY TO THE DISCO!"

### c70newsman



#### Delivered

Delivery Shift: the order arrived in good time.

1. "WELL, I'LL BE. RIGHT TO THE DOORSTEP."
2. "FASTEST SERVICE I'VE SEEN SINCE V-E DAY."
3. "THIS JUST IN: A HOT TACO, DELIVERED ON TIME."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "WE INTERRUPT THIS PROGRAM: A BULLSEYE ON THE DOORMAT!"
2. "DEAD CENTER! HAVEN'T SEEN AIM LIKE THAT SINCE ANZIO."
3. "THAT'S THE LEAD STORY TONIGHT, KID. RIGHT ON THE MAT."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "IN OTHER NEWS, MY TACO DIED OF EXPOSURE. YOU BUM."
2. "COLD. I'VE HAD WARMER CHOW IN A FOXHOLE AT BASTOGNE."
3. "LATE AND COLD. THAT'S THE WEATHER AND THE SPORTS, KID."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "WELL, I'LL BE A MONKEY'S UNCLE!"
2. "AND HERE WE SEE A TACO, LIVE, FROM THE PETUNIAS."
3. "THAT'S GOING IN THE BLOOPER REEL, YOU KNUCKLEHEAD!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "I SURVIVED THE ARDENNES, YOU HOOLIGAN! NOT FOR THIS!"
2. "SLOW DOWN! I'M ON TELEVISION! PEOPLE KNOW THIS FACE!"
3. "I'LL READ YOUR PLATE NUMBER ON THE SIX O'CLOCK NEWS!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY OLDSMOBILE! THAT'S AN ON-AIR PERSONALITY'S CAR, KID!"
2. "THIS IS AN OUTRAGE, AND I'M REPORTING IT. LITERALLY."
3. "YOU SON OF A- WE'LL BE RIGHT BACK AFTER THIS MESSAGE."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I GO ON THE AIR AT SIX. ONE BEEF BURRITO."
2. "BREAKING NEWS: I'M HUNGRY. FILM AT ELEVEN."
3. "MAKE IT QUICK, KID. THE WEATHERMAN'S COVERING FOR ME."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "FOR THE LOVE OF PETE!"
2. "I STORMED NORMANDY FOR THIS?!"
3. "I'M GETTING A REPORT THAT MY TACO DOES NOT EXIST."

#### Queue

Kitchen Shift: the line is past three customers.

1. "I CAME IN HERE A YOUNG MAN!"
2. "I'VE WAITED LONGER THAN THE WAR, KID!"
3. "THIS LINE IS A DEVELOPING STORY. WE'LL KEEP YOU POSTED. FOR YEARS."

#### Wrong

Kitchen Shift: a wrong pick.

1. "OH, I'M SORRY - YOU DIDN'T PHRASE IT IN THE FORM OF A TACO!"
2. "CORRECTION: THAT IS NOT WHAT I ORDERED, YOU BUM."
3. "THAT'S A RETRACTION, KID. TAKE IT BACK."

#### Served

Kitchen Shift: a ticket was served.

1. "FOR THE LOVE OF PETE, THAT'S A GOOD ONE."
2. "GOOD EVENING. TONIGHT'S TOP STORY: THIS TACO."
3. "GOOD NEWS FOR ONCE. A HOT TACO, MADE RIGHT."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "EXTRA! EXTRA! LOCAL COOK DOES THE IMPOSSIBLE!"
2. "FAST AND FLAWLESS. I'M PUTTING YOU ON THE BROADCAST, KID."
3. "THIRTY YEARS ON THE AIR AND I'VE NEVER SEEN THE LIKE!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "THIS STATION IS SIGNING OFF. PERMANENTLY. GOODNIGHT."
2. "I'M RUNNING A STORY ON THIS DUMP AT SIX AND ELEVEN!"
3. "I TOOK A BEACH FASTER THAN YOU MAKE A BURRITO!"

### c70militaryguy



#### Delivered

Delivery Shift: the order arrived in good time.

1. "MISSION ACCOMPLISHED, PRIVATE. CARRY ON."
2. "RIGHT ON TARGET. THE ARMY COULD USE YOU."
3. "ON TIME AND ON TARGET. AT EASE, SOLDIER."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DIRECT HIT! I'D PUT YOU IN FOR A MEDAL, PRIVATE!"
2. "BULLSEYE! THE MARINES COULDN'T THROW LIKE THAT!"
3. "TEXTBOOK DROP, SON. RIGHT IN THE LANDING ZONE."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "IN THE ARMY, A TACO TOOK THIRTY SECONDS!"
2. "COLD CHOW! I'D HAVE YOU DIGGING LATRINES FOR A WEEK!"
3. "YOU'RE LATE, MAGGOT! DROP AND GIVE ME TWENTY!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "YOU MISSED THE LZ, PRIVATE! THAT'S A COURT-MARTIAL!"
2. "IN THE SHRUBS! I'VE SEEN BETTER AIM FROM A BLINDFOLDED MULE!"
3. "THAT'S FRIENDLY FIRE ON MY PETUNIAS, SON!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "INCOMING! INCOMING! YOU NEARLY FLATTENED A VETERAN!"
2. "I DODGED WORSE THAN YOU IN THE JUNGLE, YOU PUNK!"
3. "HALT! WHO TAUGHT YOU TO DRIVE, THE ENEMY?!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY JEEP SURVIVED TWO TOURS AND YOU DENT IT IN KANSAS?!"
2. "THAT'S IT, SON. YOU JUST DECLARED WAR."
3. "I'LL NAIL YOUR HIDE TO THE MOTOR POOL WALL!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "RECON SAYS YOUR NACHOS ARE THE BEST."
2. "UP SINCE OH-FIVE-HUNDRED. FEED ME, SON."
3. "TWO HARD TACOS, AND I WANT THEM SQUARED AWAY, SON."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I SERVED IN VIETNAM FOR THIS KIND OF TREATMENT?!"
2. "TELL MY WIFE I LOVED HER!"
3. "I'VE HAD FASTER SUPPLY DROPS UNDER ENEMY FIRE, SON!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS IS EXACTLY WHY I KEEP RICE AND BEANS IN MY GARAGE!"
2. "I HAVE WAITED LONGER THAN BASIC TRAINING!"
3. "I'VE BEEN IN FOXHOLES MORE COMFORTABLE THAN THIS LINE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "THAT IS NOT REGULATION, PRIVATE! DO IT AGAIN!"
2. "WHO GAVE THAT ORDER?! NOT ME, SOLDIER! NOT ME!"
3. "I'VE SEEN GREEN RECRUITS FOLD A BURRITO BETTER THAN THAT!"

#### Served

Kitchen Shift: a ticket was served.

1. "BEATS C-RATIONS BY A COUNTRY MILE, SON."
2. "SQUARED AWAY. I'D EAT AT YOUR MESS HALL."
3. "OUTSTANDING. THAT'S A FIVE-STAR GENERAL OF A TACO."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS EXECUTION! I'M PROMOTING YOU TO SERGEANT, SON!"
2. "IN AND OUT IN RECORD TIME! A TEXTBOOK OPERATION!"
3. "IF THE ARMY HAD COOKS LIKE YOU, I'D HAVE RE-ENLISTED!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M PULLING OUT! THIS IS A TACTICAL RETREAT, NOT A SURRENDER!"
2. "THIS MESS HALL IS A DISGRACE! I'M GOING AWOL!"
3. "YOU'D BE PEELING POTATOES IN MY OUTFIT, MAGGOT!"

### c70hippiedude



#### Delivered

Delivery Shift: the order arrived in good time.

1. "RIGHT ON, MAN. THE UNIVERSE PROVIDES."
2. "FAR OUT. AND THE MAN DIDN'T STOP YOU."
3. "OUTTA SIGHT, MAN. TELL THE COOK I SAID PEACE."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "WHOA. RIGHT ON THE MAT. THAT WAS, LIKE, DESTINY, MAN."
2. "FAR OUT! YOUR AURA IS, LIKE, BLINDING ME RIGHT NOW."
3. "DEAD CENTER, MAN. I'M GONNA NEED A MINUTE WITH THAT."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD BEANS, MAN. THAT'S A BUMMER OF COSMIC PROPORTIONS."
2. "TIME IS AN ILLUSION, MAN. BUT COLD FOOD IS REAL."
3. "THE MAN GOT TO YOU, DIDN'T HE? YOU SOLD OUT, MAN."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE GARDEN, MAN?! I GOT, LIKE, SPECIAL PLANTS IN THERE!"
2. "BAD KARMA, MAN. THAT'S GONNA COME BACK ON YOU."
3. "YOU THREW MY BURRITO AT MOTHER EARTH, MAN. RUDE."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA, MAN! PEACE! I SAID PEACE, YOU FASCIST!"
2. "MAN, YOU NEARLY SENT ME TO THE NEXT PLANE OF EXISTENCE!"
3. "SLOW DOWN, MAN! YOU'RE KILLING MY BUZZ, AND ALMOST ME!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY VAN! YOU HIT THE PEACE SIGN, MAN! THE PEACE SIGN!"
2. "I'M NONVIOLENT, MAN, BUT I'M REALLY RECONSIDERING IT."
3. "YOU DENTED MY MICROBUS, YOU CORPORATE PIG!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "BEAN BURRITO, MAN. NO BEEF. PEACE."
2. "PARKED THE VAN ON THE CURB. BE COOL, MAN."
3. "WHATEVER'S GOT THE MOST GOOD ENERGY, MAN. AND NACHOS."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "THE GOVERNMENT IS BEHIND THIS TACO DELAY!"
2. "MAN, I'VE BEEN STANDING HERE SO LONG I FORGOT WHY."
3. "THIS IS LIKE A BAD TRIP, MAN. A REALLY SLOW, BAD TRIP."

#### Queue

Kitchen Shift: the line is past three customers.

1. "I COULD'VE WALKED TO MEXICO AND BACK BY NOW!"
2. "I HAD NO BEARD WHEN I GOT IN THIS LINE, MAN!"
3. "THIS LINE IS, LIKE, A METAPHOR FOR SOCIETY, MAN."

#### Wrong

Kitchen Shift: a wrong pick.

1. "BEEF?! MAN, I'M VEGETARIAN! THAT COW HAD A FAMILY!"
2. "WHOA, NOT THAT, MAN. THAT'S BAD VIBES IN A TORTILLA."
3. "YOU'RE NOT LISTENING TO THE ORDER, MAN. YOU GOTTA FEEL IT."

#### Served

Kitchen Shift: a ticket was served.

1. "GOOD VIBES, MAN. GOOD BEANS, TOO."
2. "THIS BURRITO IS A REVOLUTION, MAN."
3. "BEAUTIFUL, MAN. YOU COOK WITH LOVE. I CAN TASTE IT."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "WHOA. FAST AND PERFECT. YOU'RE, LIKE, ENLIGHTENED, MAN."
2. "THAT WAS GROOVY, MAN! GROOVIER THAN WOODSTOCK!"
3. "PEACE, LOVE AND BEAN BURRITOS, MAN! YOU GET IT!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I DROVE MY VAN HERE, MAN. I DROVE MY VAN."
2. "MY HEALER IS GOING TO HEAR ABOUT THIS!"
3. "I'M SPLITTING, MAN. THIS PLACE HAS NO SOUL."

### c70pornstar



#### Delivered

Delivery Shift: the order arrived in good time.

1. "NOW THAT'S SERVICE FIT FOR A STAR, BABY."
2. "ON TIME? KID, YOU'VE GOT STAR QUALITY."
3. "RIGHT ON CUE, BABY. I RESPECT A MAN WHO HITS HIS MARK."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "RIGHT IN THE SWEET SPOT, BABY. I KNOW A THING ABOUT THAT."
2. "ONE TAKE! EVEN I NEVER GET IT IN ONE TAKE, BABY!"
3. "DEAD CENTER! KID, YOU COULD WORK IN MY BUSINESS. CAMERA GUY."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "I'VE WRAPPED WHOLE SCENES FASTER THAN THIS, BABY."
2. "IT'S COLD, BABY. I DON'T DO COLD. I'M A PROFESSIONAL."
3. "IN MY LINE OF WORK, TIMING IS EVERYTHING. YOURS STINKS."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE BUSHES? BABY, THAT'S WHERE I SHOT MY FIRST PICTURE."
2. "YOU MISSED?! I'M IN THE BUSINESS OF NEVER MISSING, BABY!"
3. "DO YOU KNOW WHO I AM?! I DON'T FETCH, BABY!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT! THIS BODY IS INSURED BY LLOYD'S OF LONDON!"
2. "HEY! I GOT A PERFORMANCE TONIGHT! I NEED MY LEGS!"
3. "THE MUSTACHE! YOU ALMOST HIT THE MUSTACHE!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CADILLAC! THE BACK SEAT'S SEEN MORE ACTION THAN YOU!"
2. "DO YOU KNOW WHO I AM?! I'M A HOMEOWNER AND A CAR OWNER!"
3. "I KNOW A GUY WHO KNOWS A GUY WHO DOES KNEECAPS, BABY!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "DO YOU KNOW WHO I AM? HARD TACO SUPREME."
2. "MY CADILLAC'S DOUBLE-PARKED, BABY. HUSTLE."
3. "THE BIGGEST BURRITO YOU GOT, BABY. I'M USED TO BIG."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "DO YOU KNOW WHO I AM?! I'M A HOMEOWNER!"
2. "YOU THINK YOU'RE GONNA KEEP ME WAITING LIKE I'M SOMEBODY?!"
3. "LISTEN, I'LL THROW IN MY WATCH! IT'S A SEIKO!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I KNOW A GUY WHO KNOWS A GUY WHO COULD MAKE THIS TACO FASTER!"
2. "BABY, I DON'T WAIT. PEOPLE WAIT FOR ME."
3. "I GET PAID BY THE HOUR, AND THIS LINE IS COSTING ME, BABY!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "TELL THE CHEF I WANT TO SEE HIM. NO - I DEMAND TO SEE HIM."
2. "WRONG FILLING, BABY. I'M VERY PARTICULAR ABOUT WHAT GOES IN."
3. "THAT'S NOT SUPREME! I ONLY DO SUPREME, BABY!"

#### Served

Kitchen Shift: a ticket was served.

1. "MAGNIFICENT. TELL THE CHEF I'M IMPRESSED."
2. "KEEP THE CHANGE. I'M A HOMEOWNER, BABY."
3. "SATISFYING. AND BABY, I KNOW SATISFYING."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FAST, HOT AND FLAWLESS! BABY, I'VE MADE MOVIES ABOUT THAT!"
2. "THAT'S A WRAP! NO RESHOOTS! HERE'S A TWENTY, BABY!"
3. "KID, YOU'RE A NATURAL. I'D PUT YOUR NAME IN LIGHTS."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M TAKING MY MUSTACHE AND MY MONEY ELSEWHERE, BABY!"
2. "NOBODY KEEPS ME WAITING! MY PUBLIC NEEDS ME, BABY!"
3. "MY AGENT WILL CALL YOUR MANAGER! AND HIS MOTHER!"

### c70magician



#### Delivered

Delivery Shift: the order arrived in good time.

1. "BEHOLD! THE BAG APPEARS UPON MY PORCH!"
2. "ABRACADABRA, AND IT'S STILL WARM!"
3. "AND FOR MY NEXT TRICK, I EAT IT WHILE IT'S HOT!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "TA-DA! THE BAG HAS LANDED UPON THE SACRED MAT!"
2. "DEAD CENTER! EVEN I CAN'T DO THAT, AND I HAVE A WAND!"
3. "WITCHCRAFT! YOU'VE BEEN STUDYING THE DARK ARTS, BOY!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "I'VE SAWED A LADY IN HALF FASTER THAN YOU FOUND MY HOUSE!"
2. "BEHOLD, THE TACO'S WARMTH HAS VANISHED! YOU DOLT!"
3. "I PREDICTED THIS. I PREDICTED YOU'D BE A SLOWPOKE."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "BY DAVY JONES' SOMBRERO!"
2. "AND NOW I MAKE MY TACO DISAPPEAR... INTO A HEDGE!"
3. "BY THE BLOOMERS OF APHRODITE, YOU MISSED!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "BEGONE, DEMON CHARIOT! I NEARLY VANISHED FOR REAL!"
2. "WATCH IT! THERE ARE RABBITS IN THIS HAT!"
3. "I'LL TURN YOUR CAR INTO A PUMPKIN, YOU HEATHEN!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CAR! I CAN'T MAKE THAT DENT DISAPPEAR, YOU OAF!"
2. "BY THE THUNDERBOLTS OF ZEUS, YOU SHALL PAY FOR THAT!"
3. "I PLACE A HEX UPON YOUR TRANSMISSION, KNAVE!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "PICK A TACO, ANY TACO. I'LL HAVE THAT ONE."
2. "MAKE A BURRITO APPEAR, AND QUICKLY!"
3. "I SHALL HAVE THE SANCHO. YES. I KNEW YOU'D ASK."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I'M SUMMONING THE MANAGER - IT'S A LEVEL 9 SPELL!"
2. "BUT WAIT! THERE'S MORE WAITING!"
3. "I ESCAPE STRAITJACKETS FASTER THAN THIS TACO ARRIVES!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS AN ILLUSION. A CRUEL, SLOW ILLUSION."
2. "I SHALL LEVITATE TO THE FRONT! ...ANY MINUTE NOW!"
3. "EVEN HOUDINI COULDN'T ESCAPE THIS LINE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "BY THE BEARD OF ZEUS!"
2. "THAT IS NOT MY CARD! I MEAN, MY TACO!"
3. "BY THE TOENAILS OF HERCULES, YOU'VE RUINED IT!"

#### Served

Kitchen Shift: a ticket was served.

1. "A TRICK WORTHY OF HOUDINI HIMSELF!"
2. "BY THE SANDALS OF ZEUS, THAT'S DELICIOUS!"
3. "MAGNIFICENT. I SHALL CALL IT THE VANISHING TACO."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "SORCERY! FAST AND PERFECT! WHO IS YOUR MASTER?!"
2. "THE GREATEST TRICK I HAVE EVER WITNESSED! BRAVO!"
3. "BY ALL THE GODS OF OLYMPUS, YOU ARE A WIZARD, BOY!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "CURSED BE YE AND YOUR DESCENDANTS UNTO THE SEVENTH GENERATION!"
2. "I SUMMON THE SPIRIT OF MOCTEZUMA UPON YOU ALL!"
3. "I SHALL NOW MAKE MYSELF DISAPPEAR. FOREVER. POOF!"

### c70jazzmusician



#### Delivered

Delivery Shift: the order arrived in good time.

1. "PERFECT TIMING. RIGHT ON THE DOWNBEAT."
2. "SMOOTH. YOU'VE GOT A REAL FEEL FOR THIS."
3. "RIGHT IN THE POCKET. THANK YOU KINDLY, MY FRIEND."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "OH, THAT WAS A SOLO, MY FRIEND. PURE IMPROVISATION."
2. "DEAD CENTER. THAT'S A BLUE NOTE IF I EVER SAW ONE."
3. "SORRY, I HAVE TO APPLAUD. THAT WAS A MASTERPIECE."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "YOU ARE VERY, VERY SLOW, MY FRIEND!"
2. "I TRAINED AT JUILLIARD FOR THIS?!"
3. "YOU'RE DRAGGING THE TEMPO, MY FRIEND. BADLY."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE HEDGE? THAT'S A SOUR NOTE, MY FRIEND. VERY SOUR."
2. "SORRY TO BE A BOTHER, BUT YOU THREW IT IN MY BIRDBATH."
3. "I'M NOT ANGRY. I'M TRANSPOSING MY RAGE INTO B-FLAT."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH OUT! THESE FINGERS ARE MY LIVELIHOOD, YOU MANIAC!"
2. "SORRY TO BE A BOTHER, BUT YOU NEARLY KILLED ME!"
3. "MY SAX COST MORE THAN YOUR CAR, YOU JACKASS!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CAR! WITH MY UPRIGHT BASS IN THE BACK!"
2. "I'M A GENTLE MAN, MY FRIEND. YOU ARE TESTING THAT."
3. "YOU JUST PLAYED A CYMBAL CRASH ON MY BUMPER, YOU BASTARD!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "SORRY TO BE A BOTHER. I'M ON IN TWENTY."
2. "ONE SANCHO, PLEASE. THE BAND IS WAITING."
3. "A SOFT TACO, IF IT'S NO TROUBLE. AND IT MAY BE."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "SORRY TO BE A BOTHER, BUT I'M LOSING MY MIND."
2. "I'VE HELD A NOTE FOR A FULL MINUTE. THIS IS LONGER."
3. "SORRY, BUT THIS SILENCE IS NOT THE GOOD KIND OF REST."

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE HAS NO SWING, MY FRIEND. NONE."
2. "I'VE PLAYED FUNERALS WITH MORE MOVEMENT THAN THIS LINE."
3. "SORRY TO BE A BOTHER, BUT MY SET STARTS IN FIVE."

#### Wrong

Kitchen Shift: a wrong pick.

1. "WHAT A LOAD OF HORSE FEATHERS!"
2. "THAT'S THE WRONG KEY ENTIRELY, MY FRIEND."
3. "SORRY, I'M NO CHEF, BUT THAT'S A CLAM. A REAL CLAM."

#### Served

Kitchen Shift: a ticket was served.

1. "THAT'S A TACO IN PERFECT TUNE, MY FRIEND."
2. "BRAVO. A STANDING-OVATION SANCHO."
3. "BEAUTIFUL. YOU COOK LIKE COLTRANE PLAYS, MY FRIEND."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FAST AND FLAWLESS! THAT WAS A BEBOP BURRITO, MY FRIEND!"
2. "ENCORE! ENCORE! SORRY, I GOT CARRIED AWAY. ENCORE!"
3. "PERFECT TIME. PERFECT PITCH. I MAY CRY, MY FRIEND."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M AFRAID I'LL HAVE TO GIVE THIS EXPERIENCE ZERO STARS."
2. "SORRY TO BE A BOTHER, BUT I'M LEAVING AND I'M FURIOUS."
3. "I'M OFF, MY FRIEND. THIS GIG DOESN'T PAY ENOUGH."

### c70boatcaptain



#### Delivered

Delivery Shift: the order arrived in good time.

1. "AHOY! FAIR WINDS BROUGHT YE RIGHT TO ME!"
2. "LANDED SQUARE ON THE DECK. WELL THROWN!"
3. "ANCHOR'S DOWN AND SUPPER'S HOT! FINE WORK, MATEY."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "A BULLSEYE ON THE POOP DECK! HAR HAR!"
2. "DEAD CENTER! I'D MAKE YE FIRST MATE ON THE SPOT!"
3. "THAT'S A TOSS WORTHY OF A HARPOONER, LAD!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD AS THE NORTH ATLANTIC, YE BILGE RAT!"
2. "I'VE MADE MORE HEADWAY BECALMED IN THE DOLDRUMS!"
3. "LATE! I'VE KEELHAULED MEN FOR LESS, YE SCURVY DOG!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "YOU FUSTILUGS!"
2. "SHIVER ME TORTILLAS!"
3. "OVERBOARD! MY SUPPER WENT OVERBOARD INTO THE PETUNIAS!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HARD TO PORT, YE LANDLUBBER! YE NEARLY SANK ME!"
2. "WATCH YER BOW, YE BARNACLE-BRAINED BUFFOON!"
3. "MAN OVERBOARD! ...ALMOST! SLOW DOWN, YE SWAB!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YE RAMMED ME TRAILER! THAT'S AN ACT OF PIRACY!"
2. "MY BOAT! ON ITS TRAILER! IN MY OWN DRIVEWAY!"
3. "I'LL HANG YE FROM THE YARDARM, YE SALTY SON OF A-!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "ALL HANDS! ONE BEEF BURRITO, ON THE DOUBLE!"
2. "DOCKED MY BOAT AT CEDAR BLUFF FOR THIS."
3. "A COMBO BURRITO, AND MAKE IT SHIPSHAPE, LAD!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "WE DIDN'T FIGHT A WORLD WAR SO YOU COULD MAKE TACOS SLOW!"
2. "I'VE WAITED OUT HURRICANES WITH MORE PATIENCE THAN THIS!"
3. "SHAKE A LEG, YE SCURVY DOG! I'M WASTING THE TIDE!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I REMEMBER WHEN THIS WHOLE PLACE WAS A FIELD!"
2. "I'VE SAILED THE SEVEN SEAS IN LESS TIME THAN THIS!"
3. "THIS LINE'S LONGER THAN THE ANCHOR CHAIN ON A BATTLESHIP!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "AVAST YE! AVAST I SAY!"
2. "THAT'S NOT ME ORDER, YE LILY-LIVERED LANDLUBBER!"
3. "WHAT IN DAVY JONES' LOCKER IS THAT?!"

#### Served

Kitchen Shift: a ticket was served.

1. "A FINE CATCH, COOK. FINEST IN PORT."
2. "I'VE EATEN IN EVERY PORT. THIS ONE'LL DO."
3. "SHIPSHAPE AND BRISTOL FASHION, COOK! WELL DONE!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FASTER THAN A CLIPPER IN A GALE! THREE CHEERS, LAD!"
2. "BLOW ME DOWN! I'VE NEVER SEEN A GALLEY RUN SO TIGHT!"
3. "I'M PROMOTING YE TO CAPTAIN OF THE GALLEY, COOK!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "ABANDON SHIP! ABANDON THIS MISERABLE SHIP!"
2. "I'M WEIGHING ANCHOR, YE BOTTOM-FEEDING BILGE RATS!"
3. "I'D RATHER EAT HARDTACK AND SALT PORK! GOOD DAY!"

### c70beekeeper



#### Delivered

Delivery Shift: the order arrived in good time.

1. "LAND SAKES, STILL WARM! YOU'RE A GEM."
2. "OPE! RIGHT ON THE MAT. THANKS A BUNCH!"
3. "OH, THAT'S JUST THE BEE'S KNEES, HON. THANKS!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "LAND SAKES, DEAD CENTER! I'LL PUT YOU IN MY PRAYERS!"
2. "WELL, BUZZ MY HIVE, THAT'S A PERFECT LANDING!"
3. "YOU BETCHA THAT'S A BULLSEYE! THE QUEEN'D BE PROUD!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "OPE, IT'S COLD. GOSH DARN IT, IT'S STONE COLD."
2. "MY BEES MADE A JAR OF HONEY FASTER THAN YOU DROVE HERE!"
3. "SLOWER THAN HONEY IN JANUARY, YOU BIG GOOF!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "LAND SAKES ALIVE!"
2. "OPE! IN THE BEEHIVES! WELL, THAT'S YOURS NOW, BUDDY!"
3. "GOSH DARN IT, IN THE CLOVER! THE BEES ARE IN MY BURRITO!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "OPE! SORRY! WAIT, WHY AM I SORRY?! YOU NEARLY HIT ME!"
2. "WATCH IT, I'VE GOT A SMOKER, A VEIL AND A BAD TEMPER!"
3. "YOU NEARLY SQUASHED ME LIKE A DRONE, YOU JACKASS!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "OPE, YOU HIT MY TRUCK. FORTY THOUSAND BEES IN THE BACK. RUN."
2. "OH, FOR CRYING OUT LOUD! THAT'S MY ONLY TRUCK, HON!"
3. "I'M GONNA BE NICE ABOUT IT, BUT I'M ALSO GONNA SUE YA."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "BEES ARE SWARMING. QUICK, ONE SOFT TACO!"
2. "OPE, JUST GONNA SNEAK IN AN ORDER HERE."
3. "JUST A BEAN BURRITO, HON. NO RUSH. LITTLE RUSH."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "WHAT IN THE NAME OF SAM HILL IS GOING ON BACK THERE?!"
2. "I'VE GOT BEES BUSIER THAN THIS KITCHEN!"
3. "I WAS GONNA SING THIS TACO'S PRAISES... IF IT EVER ARRIVES!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "OPE, JUST GONNA STAND HERE. AND STAND HERE. AND STAND HERE."
2. "THIS LINE'S SWARMING WORSE THAN MY HIVES IN JUNE!"
3. "WELL, THIS IS A REAL CHURCH POTLUCK OF A LINE, ISN'T IT."

#### Wrong

Kitchen Shift: a wrong pick.

1. "OPE! THAT'S NOT IT, HON. THAT'S NOT IT AT ALL."
2. "GOSH DARN IT, I SAID BEANS, NOT WHATEVER THAT IS!"
3. "LAND SAKES, WHO TAUGHT YOU TO COOK, A HORNET?"

#### Served

Kitchen Shift: a ticket was served.

1. "SWEETER THAN CLOVER HONEY. YOU BETCHA."
2. "I'LL SING THIS TACO'S PRAISES AFTER ALL!"
3. "OH, YOU BETCHA, THAT HITS THE SPOT. THANK YA, HON."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "WELL, I'LL BE! QUICK AS A BEE AND SWEET AS HONEY!"
2. "OPE! THAT'S PERFECT! I'M GONNA CRY! I'M CRYING, HON!"
3. "YOU BETCHA THAT'S THE BEST TACO IN ELLIS COUNTY!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "OPE! SORRY! JUST GONNA SQUEEZE PAST YA TO THE DAIRY QUEEN!"
2. "GOIN' ONCE, GOIN' TWICE, GOIN' OUT THE DOOR!"
3. "OPE, WELL, I'LL JUST GO. AND I'LL TELL EVERYONE. NICELY."

### c70surferdude



#### Delivered

Delivery Shift: the order arrived in good time.

1. "WHOA, YOU TOTALLY CAUGHT THAT WAVE, DUDE!"
2. "RIGHTEOUS TOSS, BRAH. RIGHT ON THE STEP."
3. "TUBULAR, DUDE. RIGHT ON TIME, BRAH."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "WHOA! DEAD CENTER! THAT WAS A TOTAL HANG TEN, DUDE!"
2. "BRAH, YOU JUST SHREDDED THAT DOORMAT. RADICAL!"
3. "DUDE. DUDE. DUUUDE. RIGHT ON THE MAT, MAN."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "THIS IS HEAVIER THAN A TWO-FOOT WAVE ON A TUESDAY, DUDE."
2. "THIS IS HARSHING THE COSMIC BUZZ, MAN!"
3. "COLD TACO, DUDE. THAT'S A TOTAL WIPEOUT, MAN."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "BOGUS, BRAH! YOU WIPED OUT MY BURRITO IN THE WEEDS!"
2. "DUDE, IT'S ON THE ROOF. HOW DO I EVEN PADDLE OUT THERE?"
3. "THAT TOSS WAS KOOK CITY, MAN. TOTAL KOOK."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! YOU ALMOST WIPED ME OUT, YOU KOOK!"
2. "WATCH IT, DUDE! I'M NOT A TRAFFIC CONE, I'M A SURFER!"
3. "SLOW DOWN, BRAH! THIS AIN'T MALIBU AND YOU AIN'T COOL!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY WOODIE! DUDE, YOU DINGED MY WOODIE!"
2. "BRAH, YOU CRACKED MY LONGBOARD! THAT WAS MY BEST FRIEND!"
3. "NOT COOL, DUDE. I'M MELLOW, BUT I'M ABOUT TO GET GNARLY."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I'M GETTING MARRIED IN TWENTY MINUTES!"
2. "NO WAVES IN KANSAS, DUDE. GOT TACOS, THOUGH?"
3. "NACHOS, BRAH. MY BOARD'S ON THE ROOF RACK."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "DUUUDE, THIS TACO'S GONNA BE COLD BY THE BEACH, BRAH!"
2. "DUDE, I'VE WAITED FOR WAVES THAT CAME FASTER THAN THIS."
3. "THIS IS LIKE A TOTAL FLAT SPELL, MAN. NOTHING'S HAPPENING."

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS GNARLIER THAN A RIPTIDE, BRAH."
2. "TOO MANY KOOKS IN THE LINEUP, MAN. WAY TOO MANY."
3. "DUDE, I'VE PADDLED OUT FURTHER THAN THIS LINE'S MOVED."

#### Wrong

Kitchen Shift: a wrong pick.

1. "BOGUS, DUDE. THAT'S NOT MY BURRITO, THAT'S A WIPEOUT."
2. "NOT THAT, DUDE! YOU'RE TOTALLY KOOKING MY TACO!"
3. "DUDE, NO. THAT'S HARSH. THAT'S, LIKE, REALLY HARSH."

#### Served

Kitchen Shift: a ticket was served.

1. "STOKED, DUDE. TOTALLY STOKED."
2. "THIS TACO IS LIKE A PERFECT SET, MAN."
3. "RIGHTEOUS TACO, DUDE. YOU'RE STOKING ME OUT."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "BRAH! THAT WAS THE PERFECT WAVE! FAST AND GLASSY!"
2. "RADICAL! I'M SO STOKED I COULD PADDLE TO HAWAII!"
3. "DUDE, I'M TELLING THE WHOLE BEACH. WELL, THE POND."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I HOPE A SEAGULL STEALS YOUR KEYS!"
2. "LATER, KOOKS. I'M PADDLING OUT OF THIS DUMP."
3. "THIS PLACE IS A TOTAL CLOSE-OUT, MAN. I'M GONE."

### c70rollerskater



#### Delivered

Delivery Shift: the order arrived in good time.

1. "IT'S FINE! IT'S MORE THAN FINE! THANKS!"
2. "MY BABIES ARE GONNA EAT TONIGHT! YAY!"
3. "RIGHT ON TIME! I'M DOING A LITTLE SPIN FOR YOU!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! THAT'S A TEN FROM THE JUDGES, HONEY!"
2. "ON THE MAT! I'M DOING A TRIPLE SPIN IN YOUR HONOR!"
3. "BABIES! LOOK! THE NICE MAN HIT THE MAT!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "IT'S COLD. IT'S FINE. MY BABIES LOVE COLD BEANS. THEY DON'T."
2. "I COULD'VE SKATED TO THE STORE AND BACK TWICE, YOU TURKEY!"
3. "LATE?! MY KIDS ARE EATING THE DOG FOOD, YOU JERK!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "WHAT A TURKEY!"
2. "IN THE SPRINKLERS?! WHAT A TOTAL TURKEY!"
3. "OKAY. OKAY. I'M GONNA SKATE OVER THERE AND RUN YOU DOWN."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HEY! I'M ON EIGHT WHEELS AND NO BRAKES, YOU MANIAC!"
2. "WATCH IT, TURKEY! I NEARLY ATE CURB!"
3. "YOU ALMOST MADE ME DO THE SPLITS IN THE STREET, YOU JERK!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY PINTO! THAT'S HOW I GET THE BABIES TO SCHOOL!"
2. "IT'S FINE! IT'S FINE! IT IS NOT FINE, YOU BIG TURKEY!"
3. "I'M GONNA ROLL OVER THERE AND KICK YOUR TIRES IN!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "SKATED HERE FROM THE RINK! TWO TACOS!"
2. "ROLL ME A BURRITO, I'M ON A BREAK!"
3. "TWO NACHOS AND A SODA! I'VE GOT FOUR MINUTES OF BREAK!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "IT'S FINE. EVERYTHING'S JUST FINE."
2. "I'VE BEEN HERE SINCE BREAKFAST!"
3. "MY BABIES ARE HOME ALONE AND HUNGRY!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I COULD DO FIFTY LAPS AT THE RINK IN THIS LINE!"
2. "IT'S FINE. I'LL JUST ROLL BACK AND FORTH. FOREVER."
3. "THIS LINE MOVES SLOWER THAN COUPLES SKATE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU SCALLYWAG OF A SALSA-SLINGER!"
2. "WRONG! WHAT A TURKEY! WHAT A GOBBLING TURKEY!"
3. "NO NO NO! THAT'S NOT FINE! THAT'S NOT EVEN CLOSE TO FINE!"

#### Served

Kitchen Shift: a ticket was served.

1. "PERFECT! I'M DOING A VICTORY LAP!"
2. "YOU'RE NO TURKEY. YOU'RE A TACO HERO!"
3. "YAY! MY BABIES ARE GONNA LOVE THIS. I MIGHT NOT SHARE."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FAST AND PERFECT! I'M GONNA SKATE ON THE COUNTER!"
2. "YOU'RE THE BEST! BEST THING THAT'S HAPPENED ALL WEEK!"
3. "OH MY GOSH! WAY FASTER THAN THE RINK'S SNACK BAR!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "GOING TO... THAT GREAT... TACO STAND... IN THE SKY..."
2. "I'M ROLLING OUT OF HERE, YOU TURKEYS! FOREVER!"
3. "IT'S FINE. I'LL JUST FEED MY BABIES CEREAL. AGAIN."

### c70photographer



#### Delivered

Delivery Shift: the order arrived in good time.

1. "HOLD IT! SMILE! THAT'S A KEEPER, KID."
2. "HOME BY SIX AFTER ALL. MY WIFE OWES ME."
3. "PERFECT EXPOSURE. HOT AND ON TIME. CLICK."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "FREEZE! DON'T MOVE! I NEED A PICTURE OF THAT TOSS!"
2. "DEAD CENTER! THAT'S A COVER SHOT, KID. A COVER!"
3. "FOCUSED, FRAMED AND CENTERED. I COULDN'T DO IT BETTER."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "I TOLD MY WIFE I'D BE HOME BY SIX!"
2. "FAILURE TO DELIVER! FAILURE TO COMMUNICATE! FAILURE TO COOK!"
3. "THE TACO WAS A NO-SHOW. LIKE A WITNESS WHO'S BEEN GOTTEN TO."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "WAIT WAIT WAIT, HOLD ON, I NEED TO FILM THIS!"
2. "IN THE HEDGE. OUT OF FOCUS, OUT OF FRAME, OUT OF A TIP."
3. "THAT'S A RUINED NEGATIVE, KID. A TOTAL WASH."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT! THAT'S A THOUSAND BUCKS OF CAMERA, YOU JACKASS!"
2. "YOU NEARLY MADE ME THE SUBJECT, YOU MANIAC!"
3. "I GOT YOUR PLATE ON FILM, PAL! ON FILM!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CAR! THE WEDDING NEGATIVES ARE IN THERE! THE BRIDE WILL KILL ME!"
2. "SMILE! YOU'RE ON FILM, AND MY LAWYER WILL LOVE IT!"
3. "YOU CREASED MY BUMPER, YOU OUT-OF-FOCUS SON OF A-!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I GOT A WEDDING TO SHOOT AT FOUR. HURRY!"
2. "QUICK, BEFORE I LOSE MY LIGHT. ONE TACO."
3. "A SANCHO, QUICK. THE BRIDE'S MOTHER IS ALREADY CRYING."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "WELL, I S'POSE I'LL JUST GROW ROOTS HERE THEN. I S'POSE."
2. "OPERATORS ARE STANDING BY... UNLIKE YOUR TACO MAKER!"
3. "I'VE WATCHED FILM DEVELOP FASTER THAN THIS, PAL!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "EVERYBODY SQUEEZE IN! ...NO, WAIT, THAT'S THE PROBLEM."
2. "THIS LINE IS LONGER THAN A RECEIVING LINE AT A WEDDING."
3. "I'M LOSING THE GOLDEN HOUR STANDING IN THIS LINE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "WRONG! THAT'S OVEREXPOSED, UNDERCOOKED AND NOT MINE!"
2. "RETAKE! THAT IS NOT THE TACO I ORDERED, PAL!"
3. "THAT'S A BLURRY MESS OF A BURRITO, YOU KNUCKLEHEAD!"

#### Served

Kitchen Shift: a ticket was served.

1. "THAT'S PICTURE PERFECT. FRAME IT."
2. "THE LIGHT ON THESE NACHOS? GORGEOUS."
3. "BEAUTIFUL. I'D PUT THIS ONE IN THE PORTFOLIO."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FAST AND FLAWLESS! I'M ENLARGING THIS AND HANGING IT!"
2. "THAT'S THE SHOT OF THE YEAR, KID! THE SHOT OF THE YEAR!"
3. "HOME BY SIX! FOR ONCE IN MY LIFE, HOME BY SIX!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M OUT. I'VE GOT A WEDDING AND NO TACO, THANKS TO YOU!"
2. "MY WIFE WAS RIGHT ABOUT THIS PLACE. DON'T TELL HER."
3. "I'M SENDING A PICTURE OF THIS DUMP TO THE PAPER!"

### c70stagehand



#### Delivered

Delivery Shift: the order arrived in good time.

1. "CUE THE TACO! RIGHT ON THE MARK!"
2. "BRAVO! YOU HIT YOUR MARK ON THE PORCH."
3. "ON TIME! THAT'S BETTER THAN OUR LEADING MAN!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER ON THE MARK! SOMEONE GIVE THIS KID A TONY!"
2. "STANDING OVATION! I'M STANDING! I'M OVATING!"
3. "SPOT ON THE SPIKE MARK! I COULD WEEP INTO MY HEADSET!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "LATE FOR YOUR ENTRANCE, YOU HAM-FISTED UNDERSTUDY!"
2. "COLD! I'VE SEEN WARMER RECEPTIONS FOR A FIVE-HOUR PLAY!"
3. "YOU MISSED YOUR CUE BY A MILE, YOU KNUCKLEHEAD!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "WHAT A MAROON!"
2. "OFF THE MARK AND INTO THE ORCHESTRA PIT! I MEAN THE HEDGE!"
3. "WHAT A FLOP! WORST REVIEWS IN TOWN, KID!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HEY! I'M NOT A PROP, YOU HAM-FISTED HOOLIGAN!"
2. "WATCH IT! YOU NEARLY GAVE ME MY DEATH SCENE!"
3. "YOU HIT YOUR MARK AND NEARLY HIT ME, YOU MANIAC!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CAR! THE SET PIECES ARE IN THE TRUNK, YOU DOLT!"
2. "THE CRITICS WILL HEAR ABOUT THIS, YOU SON OF A-!"
3. "DRAMA! YOU WANT DRAMA?! I'LL GIVE YOU DRAMA!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "INTERMISSION'S FIFTEEN MINUTES. GO!"
2. "PLACES, EVERYONE! ONE COMBO BURRITO!"
3. "HARD TACO SUPREME, AND DON'T MISS YOUR CUE!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "BREAK A LEG - PREFERABLY YOURS, ON THE WAY TO MY TABLE!"
2. "IS THE KITCHEN ON A FIFTEEN-MINUTE HOLD? MOVE IT!"
3. "THIS PAUSE IS SO DRAMATIC I'M GOING TO SCREAM!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "IF I DIE HERE, BURY ME IN THE SALSA BAR!"
2. "WELL, THIS IS QUITE THE PRODUCTION, ISN'T IT?"
3. "WE'RE STANDING HERE LIKE A CHORUS WITH NO DIRECTOR!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "WRONG PROP! WRONG PROP! THAT'S NOT IN THE SCRIPT!"
2. "YOU'VE BUTCHERED THE SECOND ACT, YOU HACK!"
3. "WHO CAST YOU AS THE COOK?! RECAST! RECAST!"

#### Served

Kitchen Shift: a ticket was served.

1. "NOW THAT'S A SHOW-STOPPER, CHEF."
2. "CURTAIN CALL! TAKE A BOW, CHEF."
3. "MARVELOUS. THAT TACO DESERVES TOP BILLING."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "BRAVO! BRAVO! A FLAWLESS OPENING NIGHT!"
2. "FIVE STARS FROM THE CRITICS! WELL, FROM ME! BRAVO!"
3. "NOT ONE MISSED CUE! I'M CASTING YOU IN EVERYTHING!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "TELL... MY TACO... I... LOVED... IT..."
2. "THIS SHOW IS CLOSING ON OPENING NIGHT! GOODBYE!"
3. "I'VE SEEN BETTER PRODUCTIONS IN A HIGH SCHOOL GYM!"

### c70racecardriver



#### Delivered

Delivery Shift: the order arrived in good time.

1. "NOW THAT'S A PIT STOP! CHECKERED FLAG!"
2. "YOU DRIVE LIKE YOU MEAN IT. RESPECT."
3. "CLEAN LINE, NO LIFT. YOU'RE A NATURAL."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! THAT'S POLE POSITION, BABY!"
2. "RIGHT ON THE APEX! I'D HIRE YOU TOMORROW!"
3. "HOT DAMN! YOU PARKED IT ON THE MAT!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "I'VE SEEN FASTER CARS UP ON BLOCKS!"
2. "YOU DRIVE LIKE YOU'RE TOWING A CHURCH!"
3. "COLD AS A PIT WALL IN NOVEMBER. LAPPED!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "YOU PUT IT IN THE WALL, ROOKIE! THE HEDGE!"
2. "THAT'S A DNF IN MY PETUNIAS, JACKASS!"
3. "YOU SPUN IT INTO THE INFIELD, YOU BUM!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HEY! I DRIVE FOR A LIVING AND THAT WAS CRAP!"
2. "YOU DIVE-BOMBED ME, YOU DIRTY BASTARD!"
3. "CHECK YOUR MIRRORS, YOU GRAVEL-EATING HACK!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "THAT'S MY TOW CAR, YOU WRECKING-BALL HACK!"
2. "YOU T-BONED MY MAILBOX? YOU'RE DEAD MEAT!"
3. "I'LL PUT YOU IN THE WALL AT TURN THREE!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "QUALIFYING'S AT THREE. HAMMER DOWN!"
2. "GREEN FLAG! ONE HARD TACO, FLAT OUT!"
3. "TANK'S FULL, BELLY'S EMPTY. TWO SANCHOS!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "COME ON! COME ON! PUT THE HAMMER DOWN!"
2. "MY PIT CREW CHANGES FOUR TIRES QUICKER THAN THIS!"
3. "NOW-NOW-NOW-NOW-NOW, CAN I GET A TACO OVER HERE-HERE-HERE-HERE?!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE'S BEEN UNDER A YELLOW FLAG ALL DAY!"
2. "I'M STUCK IN TRAFFIC AT A TACO SHOP?!"
3. "WAVE THE RED FLAG! NOBODY'S MOVIN'!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU SOUR CREAM SCOUNDREL!"
2. "I OUGHTA RUN YA OUTTA TOWN ON A RAIL!"
3. "WRONG PART ON THE CAR, YOU GREASY GEARHEAD!"

#### Served

Kitchen Shift: a ticket was served.

1. "FASTER THAN MY PIT CREW! HOT DOG!"
2. "THAT'S VICTORY LANE MATERIAL, FRIEND."
3. "HOLDS THE ROAD. HOLDS TOGETHER. WINNER."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "TRACK RECORD! SOMEBODY SPRAY ME WITH CHAMPAGNE!"
2. "FLAWLESS LAP! I'D KISS YOU ON THE PODIUM!"
3. "THAT'S A PERFECT PIT STOP, BABY! WHOO!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "SADDLE UP, FRIEND - WE'RE RIDIN' BACK TO TACO BELL!"
2. "I'M PULLIN' INTO THE GARAGE. RETIRED. DONE!"
3. "BLACK FLAG ON THIS DUMP! I'M OUTTA HERE!"

### c70soultrainguy



#### Delivered

Delivery Shift: the order arrived in good time.

1. "NOW THAT'S A DELIVERY WITH SOME SOUL!"
2. "SMOOTH MOVE, MY MAN. SMOOTH MOVE."
3. "RIGHT ON TIME AND RIGHT ON THE ONE, BROTHER."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD ON THE MAT! YOU GOT RHYTHM, BABY!"
2. "OOH! THAT TOSS HAD A BACKBEAT!"
3. "BULLSEYE! SOMEBODY GIVE THIS CAT A TROPHY!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "THIS BURRITO'S COLDER THAN MY EX-WIFE."
2. "YOU MISSED THE BEAT BY ABOUT AN HOUR, JACK!"
3. "COLD FOOD AND NO SOUL. THANKS FOR NOTHING."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE HEDGE? THAT'S NO WAY TO TREAT A SANCHO!"
2. "YOU THREW MY DINNER ON THE ROOF, FOOL!"
3. "MAN, YOU GOT TWO LEFT HANDS AND NO FEET!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "YOU NEARLY RAN OVER MY PLATFORMS, YOU MANIAC!"
2. "SLOW DOWN! THESE PANTS COST ME A WEEK'S PAY!"
3. "HEY! I GOT MOVES, BUT I CAN'T OUTDANCE A CAR!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "THAT'S MY CUSTOM PAINT, YOU TONE-DEAF FOOL!"
2. "YOU DENTED MY RIDE! I OUGHTA DENT YOUR HEAD!"
3. "YOU HIT MY CAR AND KILLED MY EIGHT-TRACK, MAN!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "DANCE CONTEST AT EIGHT. LET'S GO!"
2. "SOMETHING WITH SOUL, PLEASE. A SANCHO!"
3. "GOT A DATE AND A NEW SHIRT. DON'T BLOW IT."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "HONEST TO GOD, THIS IS A JOKE!"
2. "I'VE DONE THE HUSTLE TWICE WAITING ON YOU!"
3. "THE BAND'S PLAYING AND I'M STANDING HERE!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE ISN'T MOVING AND NEITHER IS MY HEART."
2. "THIS LINE'S LONGER THAN A DANCE CONTEST!"
3. "EVERYBODY'S STANDING STILL. THIS IS A WAKE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "THIS IS A DISGRACE TO TACOS!"
2. "MERCY ME! MERCY ME, I TELL YOU!"
3. "THAT'S OFF THE BEAT, MAN! WAY OFF!"

#### Served

Kitchen Shift: a ticket was served.

1. "YOUR SALSA HAS NO CHUNKS AND NO SOUL!"
2. "NOW THIS SALSA'S GOT CHUNKS AND SOUL!"
3. "MERCY ME, THAT'S GOOD. I GOTTA DANCE."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "OH, BABY! YOU COOKED THAT LIKE A LOVE SONG!"
2. "SPOTLESS! I'M DOING THE SPLITS RIGHT HERE!"
3. "THAT'S A NUMBER ONE HIT, BROTHER! GOLD RECORD!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M TAKING MY SOUL AND MY MONEY ELSEWHERE!"
2. "LATER, SQUARE. THE DANCE FLOOR WON'T WAIT."
3. "NO SOUL, NO TACO, NO TIP! GOODNIGHT!"

### c70longhair2



#### Delivered

Delivery Shift: the order arrived in good time.

1. "WHOA. IT CAME. IS ANYTHING REAL? THIS IS."
2. "GROOVY, MAN. I'LL WRITE A HAPPY SONG NOW."
3. "FAR OUT. THE UNIVERSE SENT ME A BURRITO."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "WHOA. DEAD CENTER. YOU'RE LIKE, ONE WITH IT."
2. "THE MAT, MAN. IT LANDED ON THE MAT. HEAVY."
3. "THAT WAS COSMIC. DO IT AGAIN. NO, DON'T."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "THE MOON LANDING WASN'T REAL AND NEITHER IS THIS TACO!"
2. "IT'S COLD, MAN. LIKE MY OLD LADY'S HEART."
3. "I WAITED SO LONG I FORGOT I WAS HUNGRY. BUMMER."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "THE BUSHES ATE MY TACO. THAT'S HEAVY, MAN."
2. "YOU THREW IT ON THE ROOF? WHAT A DRAG."
3. "UNCOOL, MAN. MY NACHOS ARE IN THE DOG'S DISH."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! SLOW DOWN, MAN, I'M HAVIN' A MOMENT!"
2. "YOU ALMOST SENT ME TO THE NEXT PLANE, MAN!"
3. "HEY, PIG! OH, YOU'RE NOT A COP. STILL A PIG!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY VAN! YOU HIT THE MURAL, YOU SQUARE!"
2. "THAT DENT HAS BAD KARMA, MAN. YOUR BAD KARMA."
3. "YOU HIT MY MAILBOX. IT WAS A SCULPTURE, MAN!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I'M HERE. I THINK. ONE SOFT TACO, MAN."
2. "WHAT TIME IS IT? DOESN'T MATTER. NACHOS."
3. "MAN, THE MUNCHIES ARE REAL. ONE BEAN BURRITO."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "WHAT IS TIME? WHAT IS A TACO? WHAT AM I?!"
2. "HEY, I'M WALKIN' HERE! WELL, I WOULD BE, IF I HAD MY TACO!"
3. "MAN, THIS IS SO NOT GROOVY!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS LIKE A METAPHOR, MAN. FOR DEATH."
2. "WE'RE ALL JUST WAITING, MAN. FOR TACOS. FOR LIFE."
3. "THE MAN WANTS US IN LINE. I WON'T CONFORM. MUCH."

#### Wrong

Kitchen Shift: a wrong pick.

1. "THAT'S NOT IT, MAN. THAT'S LIKE, THE OPPOSITE."
2. "BUMMER, MAN. YOU'RE MAKING SOMEBODY ELSE'S TACO."
3. "WHOA. HEAVY. AND WRONG. MOSTLY WRONG."

#### Served

Kitchen Shift: a ticket was served.

1. "WHAT IS A TACO? THIS. THIS IS A TACO."
2. "TOTALLY GROOVY. MY MIND IS BLOWN, MAN."
3. "THIS TACO UNDERSTANDS ME, MAN. FINALLY."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT, MAN. I'M GONNA CRY. I'M CRYING."
2. "THAT WAS LIKE WATCHING JIMI PLAY. A TACO JIMI."
3. "YOU'RE A GURU, MAN. TEACH ME YOUR WAYS."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M GONNA WRITE A SAD SONG ABOUT THIS TACO SHOP!"
2. "I'M SPLITTIN', MAN. THIS PLACE IS A BUMMER."
3. "MY KARMA SAYS LEAVE AND MY STOMACH SAYS DIE."

### c70flowerchild



#### Delivered

Delivery Shift: the order arrived in good time.

1. "PEACE AND LOVE, DELIVERY FRIEND!"
2. "MY CHAKRAS ARE ALIGNED. THANK YOU!"
3. "BLESSINGS ON YOUR TIRES, SWEET SOUL."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "RIGHT ON THE MAT! THE UNIVERSE GUIDED YOU!"
2. "DEAD CENTER! YOUR AURA IS PURE GOLD!"
3. "FAR OUT! I'M GONNA HUG YOU! COME BACK!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD BEANS. MY KARMA DIDN'T DESERVE THIS."
2. "I MEDITATED THREE TIMES WAITING, YOU CREEP."
3. "THIS FOOD HAS DIED, MAN. I'LL BURY IT."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "YOU HURT MY PETUNIAS! THEY HAVE FEELINGS!"
2. "YOU THREW IT AT MY GARDEN, YOU NARC!"
3. "NOT IN THE SUNFLOWERS! I TALK TO THOSE!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "PEACE, MAN! WHOA! I MEAN IT! PEACE!"
2. "YOU NEARLY MADE ME ONE WITH THE PAVEMENT!"
3. "WATCH IT, YOU GAS-GUZZLING WAR MACHINE!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY BEETLE! IT HAD DAISIES ON IT, YOU BRUTE!"
2. "YOU DENTED MY VAN! THAT'S VIOLENCE, MAN!"
3. "I HOPE YOUR HUBCAPS FALL OFF ON I-70!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I MADE YOU A DAISY CHAIN. ONE TACO?"
2. "NO MEAT, PLEASE. JUST BEANS AND GOOD VIBES."
3. "BEAN BURRITO, PLEASE. HOLD THE SUFFERING."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "THIS IS HARSHING MY CHAKRAS!"
2. "MY INNER PEACE IS RUNNING OUT, MAN. FAST."
3. "I'M TRYING TO STAY MELLOW HERE, BUT HELL!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I HAVE TRANSCENDED HUNGER. I AM ONE WITH THE LINE."
2. "THIS LINE IS A SYMPTOM OF THE ESTABLISHMENT!"
3. "OKAY, I'M NOT ONE WITH THE LINE ANYMORE."

#### Wrong

Kitchen Shift: a wrong pick.

1. "IS THAT MEAT?! YOU MURDERER! NO MEAT!"
2. "THAT'S NOT MY ORDER! THAT'S BAD KARMA, MAN!"
3. "OH NO. I CAN FEEL THE WRONG ENERGY FROM HERE."

#### Served

Kitchen Shift: a ticket was served.

1. "THIS BEAN BURRITO HAS A BEAUTIFUL AURA."
2. "PEACE, LOVE AND TACOS. YOU GET IT."
3. "MADE WITH LOVE. I CAN TASTE IT, MAN."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT! YOU'RE AN ENLIGHTENED BEING, MAN!"
2. "I'M CRYING! THIS IS THE GOOD KIND OF TRIP!"
3. "FAR OUT! I'M NAMING MY NEXT GOAT AFTER YOU!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "MAY YOUR CILANTRO TASTE LIKE SOAP FOREVER!"
2. "I'M BOYCOTTING THIS RESTAURANT!"
3. "PEACE, LOVE AND LEAVING - THAT'S WHAT I'M DOING!"

### c70taxman



#### Delivered

Delivery Shift: the order arrived in good time.

1. "WELL, OKAY THEN. FULL TIP. YOU BETCHA."
2. "ON TIME. THAT'S ONE DEDUCTION I WON'T TAKE."
3. "PROMPT AND ITEMIZED. YOU BETCHA, THAT'S NICE."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! WELL, THAT'S A WRITE-OFF I'D TAKE!"
2. "OH JEEZ, RIGHT ON THE MAT! AUDITED AND CLEAN!"
3. "WELL GOLLY. THAT'S PRECISE TO THE PENNY."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "YOU LITTLE WHIPPERSNAPPER!"
2. "YOU BETCHA THAT'S COMING OUT OF THE TIP. OH BOY."
3. "COLD AS A REFUND CHECK, BUSTER. OH BOY."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE HEDGE? THAT'S A TOTAL LOSS, YOU DIPSTICK!"
2. "OH, FOR CRYIN' OUT LOUD! FILE THAT AS A CASUALTY!"
3. "YOU LUNKHEAD! THAT'S A DEPRECIATED BURRITO!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "OH JEEZ! I'M NOT DONE WITH MY RETURN YET!"
2. "SLOW DOWN, YOU DANG HOOLIGAN! SORRY! NO!"
3. "HEY! I'LL AUDIT YOUR WHOLE FAMILY, BUSTER!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CHRYSLER! OH, YOU SON OF A- SORRY. NOT SORRY."
2. "I'LL ITEMIZE EVERY DENT, YOU DARN PIRATE!"
3. "THAT MAILBOX IS FEDERAL PROPERTY! SORT OF!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "APRIL FIFTEENTH IS COMING. ONE TACO, QUICK."
2. "I'LL NEED A RECEIPT FOR THAT, OKAY?"
3. "TWO SOFT TACOS. EXACT CHANGE. DON'T ROUND UP."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "OH BOY. OH JEEZ. OH, YOU BETCHA I'M STEAMED."
2. "I'VE AUDITED FARMS FASTER THAN THIS, DARN IT!"
3. "WELL, THIS IS JUST A PICKLE NOW, ISN'T IT, BUSTER."

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE'S LONGER THAN THE TAX CODE, OH BOY."
2. "SORRY, BUT WHAT IN THE HELL IS THE HOLDUP? SORRY."
3. "I'D CHARGE INTEREST ON THIS WAIT IF I COULD."

#### Wrong

Kitchen Shift: a wrong pick.

1. "THIS GENERATION CAN'T MAKE A TACO WITHOUT THEIR DISCO RECORDS!"
2. "YOU SNOLLYGOSTER!"
3. "OH, NOW THAT'S A MISSTATEMENT, YOU NINCOMPOOP."

#### Served

Kitchen Shift: a ticket was served.

1. "THE NUMBERS ADD UP. THAT'S A GOOD TACO."
2. "SORRY, JUST... THAT'S REAL GOOD. SORRY."
3. "BALANCED TO THE PENNY. OH, THAT'S NICE."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "NOT ONE ERROR! I COULD KISS YOU! SORRY!"
2. "OH JEEZ LOUISE, THAT'S A CLEAN RETURN!"
3. "FLAWLESS! I'M TELLING MY WIFE! SHE WON'T CARE!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'D LIKE TO FILE A POLITE COMPLAINT, SORRY."
2. "WELL, I'M LEAVIN'. SORRY. NO, YOU'RE SORRY."
3. "SEE YOU IN APRIL. WITH A CLIPBOARD. OH BOY."

### c70sportsannouncer



#### Delivered

Delivery Shift: the order arrived in good time.

1. "HE TOSSES... IT'S ON THE PORCH! TOUCHDOWN!"
2. "WHAT A THROW, FOLKS! RIGHT ON THE NUMBERS!"
3. "RIGHT ON SCHEDULE, FOLKS! A CLEAN DRIVE!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! IT'S GOOD! IT'S GOOD! IT'S GOOD!"
2. "A PERFECT STRIKE, FOLKS! THE CROWD'S ON ITS FEET!"
3. "HOLE IN ONE ON THE DOORMAT! UNBELIEVABLE!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "AND THE CLOCK RUNS OUT ON THIS SORRY DRIVE!"
2. "COLD FOOD, FOLKS. A REAL STINKER OF A GAME."
3. "THAT'S DELAY OF DINNER! WORST I'VE EVER CALLED!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "HOLY COW! HOLY COW, I SAY!"
2. "AND IT'S WIDE RIGHT! INTO THE SHRUBBERY, FOLKS!"
3. "A BOTCHED THROW, FOLKS! THIS KID IS A BUM!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! A NEAR-COLLISION AT THE CROSSWALK, FOLKS!"
2. "THAT'S ROUGHING THE ANNOUNCER, YOU JACKASS!"
3. "FLAG ON THE PLAY! RECKLESS DRIVING! EJECT HIM!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "AND HE PLOWS RIGHT INTO MY BUICK! A DISASTER!"
2. "THAT'S A PERSONAL FOUL, AND A LAWSUIT, FOLKS!"
3. "WHAT A HIT! AND I'LL HIT BACK, YOU BUM!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "WE'RE LIVE IN TEN, FOLKS! ONE SANCHO!"
2. "IT'S HALFTIME! I GOT TWELVE MINUTES, KID!"
3. "PREGAME SHOW IN FIVE! TWO HARD TACOS, KID!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I'M GONNA MISS THE FIRST QUARTER, JEROME!"
2. "MY GRANDCHILDREN WILL EAT THIS TACO!"
3. "THE CLOCK IS TICKING AND THIS KID IS FROZEN!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "WE ARE WITNESSING A HISTORIC MELTDOWN HERE TODAY, FOLKS!"
2. "WE'RE IN A RAIN DELAY HERE, FOLKS. NO RAIN!"
3. "DELAY OF GAME! DELAY! OF! GAME!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "OFFENSIVE HOLDING ON THE TACO MAKER, FIFTEEN YARDS!"
2. "FUMBLE! THE COOK COUGHS UP THE CHEESE!"
3. "OH, HE'S GOING THE WRONG WAY! WRONG WAY!"

#### Served

Kitchen Shift: a ticket was served.

1. "THE CROWD GOES WILD, FOLKS! WHAT A TACO!"
2. "A HALL OF FAME BURRITO! HOLY COW!"
3. "A SOLID PERFORMANCE, FOLKS. THREE STARS."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "A PERFECT GAME, FOLKS! NO HITS, NO ERRORS!"
2. "RETIRE THAT APRON, FOLKS! HANG IT IN THE RAFTERS!"
3. "UNBELIEVABLE! IT'S A RECORD, AND I CALLED IT!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "AND HE'S OUTTA HERE, FOLKS! THE CUSTOMER HAS LEFT THE BUILDING!"
2. "AND THAT'S THE BALLGAME, FOLKS! GOODNIGHT!"
3. "THE CUSTOMER WALKS! A DISGRACE TO THE SPORT!"

### c70greaser



#### Delivered

Delivery Shift: the order arrived in good time.

1. "NOT BAD, DADDY-O. YOU'RE ALRIGHT."
2. "COLLECTED ON MY BET. KEEP THE CHANGE."
3. "RIGHT ON TIME. YOU GOT SOME GREASE IN YA."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD ON THE MAT? COOL, DADDY-O. REAL COOL."
2. "WHOA, NOW THAT'S SMOOTH. LIKE MY HAIR."
3. "PERFECT TOSS. I OWE MY BUDDY TEN BUCKS. JERK."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD? MY HAIR GREASE IS WARMER THAN THIS TACO."
2. "YOU DRIVE LIKE MY GRANDMA'S DEAD CAT."
3. "I COMBED MY HAIR FOUR TIMES WAITIN', CREEP."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "SWEET MOTHER MARY AND JOSEPH!"
2. "I HAD MONEY ON THIS TACO, DUDE!"
3. "IN THE BUSHES?! YOU SQUARE-HEADED GOON!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HEY! WATCH IT, YOU MADE ME DROP MY COMB!"
2. "YOU WANNA GO, PAL? GET OUTTA THAT CAR!"
3. "WATCH THE JACKET! THAT'S REAL LEATHER, CREEP!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY HOT ROD! YOU'RE GONNA EAT THAT BUMPER!"
2. "YOU DENTED MY CHEVY. YOU'RE DEAD, TACO BOY!"
3. "I SPENT THREE YEARS ON THAT PAINT, YOU BUM!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "MY HOT ROD'S RUNNING. MAKE IT SNAPPY."
2. "HARD TACO. EXTRA HARD. LIKE ME."
3. "NACHOS. AND DON'T LOOK AT MY GIRL."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "FIFTY DOLLARS. CASH. NOW."
2. "MY HAIR'S WILTIN', TACO BOY. MOVE IT!"
3. "YOU'RE SLOWER THAN A STALLED FORD, PAL."

#### Queue

Kitchen Shift: the line is past three customers.

1. "I THINK I DIED AND THIS IS PURGATORY!"
2. "WHO DO I GOTTA LEAN ON TO MOVE THIS LINE?"
3. "THIS LINE'S DRAGGIN' WORSE THAN MY OLD CHEVY."

#### Wrong

Kitchen Shift: a wrong pick.

1. "WHAT'S THE MATTER WITH YOU? WHAT'S THE MATTER?!"
2. "HEY! YOU TRYIN' TO START SOMETHIN'?"
3. "WRONG ONE, GREASEBALL. AND I KNOW GREASE."

#### Served

Kitchen Shift: a ticket was served.

1. "NOW THAT'S A TACO WITH SOME ATTITUDE."
2. "YOU'RE ALRIGHT, TACO BOY. YOU'RE ALRIGHT."
3. "COOL. YOU'RE ALRIGHT. DON'T GET SOFT."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT! YOU'RE OFFICIALLY IN THE GANG, KID!"
2. "NOW THAT'S A TACO SHARPER THAN MY PANT CREASE!"
3. "AYYY! THAT'S THE MOST, TACO BOY. THE MOST!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'LL SEE YA IN THE PARKING LOT, TACO BOY!"
2. "THIS JOINT IS DEAD. I'M BOOKIN' IT."
3. "YOU JUST LOST MY WHOLE GANG'S BUSINESS, SQUARE!"

### c70discoqueen



#### Delivered

Delivery Shift: the order arrived in good time.

1. "WELL, I DECLARE! RIGHT ON THE STOOP!"
2. "OH HONEY, YOU'RE A STAR. A REAL LEO."
3. "ON TIME? HONEY, YOU MUST BE A VIRGO."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! HONEY, THAT'S STAR QUALITY!"
2. "OOH, RIGHT ON THE MAT! I COULD JUST DIE!"
3. "WELL, AREN'T YOU A SAGITTARIUS! BULLSEYE!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD AS MY SECOND HUSBAND, HONEY. AND SLOWER."
2. "I'VE HAD MARRIAGES SHORTER THAN THIS WAIT!"
3. "HONEY, MY HAIR SPRAY SET FASTER THAN YOU."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "MAMMA MIA! WHAT IS THIS?!"
2. "IN THE AZALEAS?! YOU CLUMSY GEMINI!"
3. "ON THE ROOF?! I'M NOT CLIMBIN' IN THESE HEELS!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT! THESE SEQUINS ARE NOT INSURED!"
2. "YOU NEARLY RUINED MY NIGHT AND MY NAILS, HONEY!"
3. "OH, YOU NO-GOOD TAURUS! YOU NEARLY HIT ME!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CADILLAC! HONEY, YOU'RE GONNA PAY FOR THAT!"
2. "YOU HIT MY CAR? I'LL SIC MY EX-HUSBANDS ON YOU!"
3. "THAT'S A NEW DENT AND A NEW LAWYER, SUGAR!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I'M DUE ON THE DANCE FLOOR AT NINE, HONEY!"
2. "SOMETHING SPARKLY, DARLING. A SUPREME!"
3. "HARD TACO SUPREME, HONEY. EXTRA SPARKLE."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "OH, FOR HEAVEN'S SAKE, HONEY!"
2. "IT'S COCKTAIL HOUR AND I'M STILL HERE!"
3. "HONEY, MY LASHES ARE WILTING. HURRY UP!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "HONEY, THIS LINE IS LONGER THAN MY ALIMONY LIST!"
2. "I DID NOT WEAR PLATFORMS TO STAND IN A LINE!"
3. "THIS LINE HAS NO RHYTHM, HONEY. NONE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "WHAT AN OUTRAGE!"
2. "YOUR KITCHEN IS A CAPRICORN WITH A PISCES MOON. NOT A COMPLIMENT!"
3. "WRONG! HONEY, YOU'RE A SCORPIO. I CAN TELL."

#### Served

Kitchen Shift: a ticket was served.

1. "THE STARS LOVE THIS TACO, HONEY. SO DO I."
2. "HONEY, THIS IS THE BEST THING IN KANSAS."
3. "LOOK AT THAT TACO SHINE. JUST LIKE ME."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT! HONEY, I'M DEDICATING A DANCE TO YOU!"
2. "OH, I COULD JUST KISS YOU, LIPSTICK AND ALL!"
3. "SPOTLESS! YOU MUST BE A LEO RISING, SUGAR!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M GOING HOME AND HAVING A STRONG ICED TEA, I DECLARE!"
2. "I'M OFF TO THE CLUB, HONEY. HUNGRY AND FABULOUS!"
3. "BYE, SUGAR! THE STARS SAY YOU'RE A DISASTER!"

### c70artist



#### Delivered

Delivery Shift: the order arrived in good time.

1. "THE BOUQUET IS... COMPLEX. I APPROVE."
2. "PROMPT. HOW WONDERFULLY UNPRETENTIOUS."
3. "ON TIME. HOW... BOURGEOIS. I LOVE IT."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER. THE COMPOSITION IS FLAWLESS."
2. "YOU'VE MADE A STATEMENT ON MY DOORMAT. BRAVO."
3. "THAT TOSS WAS PERFORMANCE ART. I'M WEEPING."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "THE BOUQUET OF THIS PLACE IS... DISAPPOINTMENT."
2. "BAD VIBES, BROTHER. BAD VIBES."
3. "COLD. LIFELESS. LIKE A WATERCOLOR OF A MOTEL."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE HEDGE. HOW DERIVATIVE, YOU PHILISTINE."
2. "YOU'VE MADE A JACKSON POLLOCK OF MY LAWN."
3. "ON THE ROOF? IS THAT A STATEMENT? A BAD ONE."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "YOU NEARLY RUINED MY CANVAS, YOU UNCULTURED OAF!"
2. "WATCH IT! I'M AN ARTIST, NOT A SPEED BUMP!"
3. "YOU DRIVE LIKE A CRITIC: NO VISION, ALL NOISE!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY VOLVO! IT WAS A FOUND OBJECT, YOU BRUTE!"
2. "YOU'VE COLLAGED MY BUMPER, YOU TALENTLESS HACK!"
3. "THAT DENT IS UNINSPIRED, AND SO ARE YOU."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "ARE THESE TACOS ORGANIC? ARE THE BEANS UNION-PICKED?!"
2. "DO YOU HAVE ANYTHING... HANDMADE? I'LL WAIT."
3. "I'LL HAVE THE SOFT TACO. IT'S HONEST."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "THE MOUTHFEEL OF THIS WAIT IS JUST... TROUBLING."
2. "HMM. WELL. I HAVE... THOUGHTS. ABOUT THIS. EXPERIENCE."
3. "I'VE STARTED AND ABANDONED THREE PAINTINGS HERE."

#### Queue

Kitchen Shift: the line is past three customers.

1. "I'VE BEEN WAITING SINCE THE TIME OF MOCTEZUMA!"
2. "THIS LINE IS A STILL LIFE. NOTHING MOVES."
3. "I'LL CALL IT 'QUEUE WITH DESPAIR'. OIL ON ME."

#### Wrong

Kitchen Shift: a wrong pick.

1. "NO. NO. THAT'S A BOLD CHOICE. A BAD CHOICE."
2. "YOU'RE PAINTING WITH THE WRONG PALETTE, DARLING!"
3. "THAT'S NOT MY ORDER. THAT'S KITSCH."

#### Served

Kitchen Shift: a ticket was served.

1. "THE MOUTHFEEL. THE TEXTURE. A MASTERPIECE."
2. "I MAY PAINT THIS SANCHO. IT SPEAKS TO ME."
3. "HONEST. UNFUSSY. I MAY HANG IT ON A WALL."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "A MASTERPIECE! I'M SIGNING IT. NO, YOU SIGN IT."
2. "THE GALLERY WILL WANT THIS. I WON'T LET THEM."
3. "PERFECT. I HAVE TO LIE DOWN. ART DOES THIS."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M LEAVING. THIS PLACE HAS THE SOUL OF A CARPORT."
2. "I'LL PAINT THIS PLACE. IN BROWN. ONLY BROWN."
3. "I'D RATHER EAT MY OWN CHARCOAL. GOOD DAY."

### c70easyrider



#### Delivered

Delivery Shift: the order arrived in good time.

1. "WELL ALRIGHT. THAT'S A CLEAN RUN, PARTNER."
2. "MY HOG COULDN'T HAVE DONE IT FASTER."
3. "HOT, ON TIME, AND IN MY LAP. JUST HOW I LIKE IT."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "RIGHT ON THE MAT. GENTLE HANDS, PARTNER. CALL ME."
2. "THAT GAVE ME A TINGLE IN MY CHAPS, PARTNER."
3. "BULLSEYE. AIN'T BEEN THIS EXCITED SINCE STURGIS."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "I GOT 5 YEARS OF FREEZE-DRIED FOOD AT HOME AND I CAME HERE!"
2. "COLD BEANS. AND I'M GONNA PAY FOR 'EM TWICE."
3. "SO LATE MY LEATHERS STUCK TO ME. ALL OF ME."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE BUSHES? THAT'S WHERE I DO MY BUSINESS!"
2. "WORSE AIM THAN ME AT A TRUCK STOP URINAL."
3. "MY BURRITO'S IN THE WEEDS. SO'S MY UNDERWEAR."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! YOU NEARLY RAN OVER MY GOOD PARTS, PARTNER!"
2. "SLOW DOWN! I JUST GOT MY PANTS BACK ON!"
3. "YOU SCARED ME SO BAD I CLENCHED FOR TWO STATES!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "THAT'S MY HOG! I'VE KISSED HER MORE THAN MY WIFE!"
2. "YOU DENTED MY TANK! SHE'S A LADY, YOU ANIMAL!"
3. "I'LL TIE YOUR BUMPER TO MY HOG AND DRAG IT HOME!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "MY HOG'S RESTLESS. TWO BURRITOS, PARTNER."
2. "RODE IN ON I-70 AND I'M STARVIN'."
3. "BEAN BURRITO. A BIG ONE. I GOT ROOM TO FILL."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "WHAT THE DEVIL, MAN?!"
2. "I RODE MY HOG HERE, PARTNER. AND SHE'S GETTIN' MIGHTY RESTLESS!"
3. "MY BELLY'S GROWLIN', AND SO'S SOMETHIN' LOWER."

#### Queue

Kitchen Shift: the line is past three customers.

1. "I HAVE KNOWN WAR. I HAVE KNOWN FAMINE. THIS IS WORSE."
2. "THIS LINE'S TIGHTER THAN MY RIDIN' PANTS, PARTNER."
3. "I HELD IT FOUR HUNDRED MILES. I CAN'T HOLD THIS."

#### Wrong

Kitchen Shift: a wrong pick.

1. "WRONG ONE. YOU FUMBLE LIKE A GROOM ON HIS BIG NIGHT."
2. "EASY. THEM BEANS'LL WAKE THE DEAD AND MY TENT-MATE."
3. "WRONG! I'VE HAD BETTER HANDS ON ME AT A CAR WASH."

#### Served

Kitchen Shift: a ticket was served.

1. "I HAVE KNOWN FAMINE. THIS IS THE CURE."
2. "NOW THAT'S WORTH THE RIDE FROM WAKEENEY."
3. "THAT'LL STICK TO MY RIBS AND A FEW OTHER PLACES."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT. I'M GONNA NEED A CIGARETTE AFTER THAT."
2. "I GOT A TATTOO SPOT WITH YOUR NAME ON IT. LOW."
3. "THAT'S SO GOOD MY CHAPS JUST FELL OFF, PARTNER."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'D LOSE MY WOMAN, MY HAT, AND MY DOG BEFORE I'D COME BACK HERE!"
2. "MY HOG GIVES ME MORE LOVIN' THAN THIS PLACE."
3. "FORGET IT. I'LL EAT BUGS AT SEVENTY MILES AN HOUR."

### c70discodude



#### Delivered

Delivery Shift: the order arrived in good time.

1. "NOW THAT'S A PRIZE WORTH SPINNING FOR!"
2. "OUTTA SIGHT! YOU'RE A REAL PRO, FRIEND."
3. "RIGHT ON TIME, BABY. YOU GOT THE MOVES."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD ON THE MAT! THAT TOSS WAS PURE BOOGIE!"
2. "WHOA! THAT LANDED SMOOTHER THAN MY PICKUP LINES!"
3. "BULLSEYE, BABY! I'M DOIN' THE POINT FOR YOU!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "TELL THEM WHAT THEY DON'T GET, BOB!"
2. "THE CLUB'S CLOSED, MAN. MY NIGHT IS DEAD."
3. "COLD FOOD AND A COLD BED. THANKS A LOT, PAL."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE HEDGE?! MY WHITE SUIT'S GOIN' IN THERE NOW?"
2. "YOU THREW IT LIKE A WALLFLOWER, YOU SQUARE!"
3. "ON THE ROOF?! IS THIS SOME KINDA SICK JOKE?!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH THE POLYESTER, MAN! IT'S FLAMMABLE!"
2. "YOU NEARLY STEPPED ON MY FEET WITH A CAR, CREEP!"
3. "HEY! I'M STRUTTIN' HERE, YOU TONE-DEAF TURKEY!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY TRANS AM! I'LL SUE YOUR BELL BOTTOMS OFF!"
2. "YOU SCRATCHED MY CAR, YOU BOOGIE-LESS BUM!"
3. "YOU DENTED MY LOVE MACHINE! MY LOVE MACHINE!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "THE CLUB OPENS AT TEN. LET'S BOOGIE!"
2. "MAKE IT QUICK. MY POLYESTER'S STARTING TO MELT."
3. "TWO TACOS, PAL. I GOT A HOT DATE AND A COLD WALLET."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "MY HAIR'S FALLIN' FLAT, MAN. THIS IS SERIOUS!"
2. "I'M SWEATIN' THROUGH MY SHIRT, PAL. HURRY!"
3. "THE BEAT'S DROPPIN' WITHOUT ME! COME ON!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE MOVES SLOWER THAN A SLOW DANCE!"
2. "I GOT A LADY WAITIN' AND A LINE THAT AIN'T!"
3. "MY GOLD CHAIN'S TARNISHIN' IN THIS LINE, MAN."

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU GADZOOKLING TWIT!"
2. "I'D KICK YOUR REAR END CLEAR INTO NEXT WEEK!"
3. "WHOA WHOA, PAL. THAT'S A BUM STEP!"

#### Served

Kitchen Shift: a ticket was served.

1. "FAR OUT. I'M TELLING THE WHOLE CLUB."
2. "THAT TACO'S GOT MORE MOVES THAN I DO."
3. "THAT'S SMOOTH, MAN. LIKE A BALLAD."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT, BABY! I'M GONNA HUSTLE ALL NIGHT ON THIS!"
2. "THAT'S A TEN, MAN! YOU OWN THE DANCE FLOOR!"
3. "SPOTLESS! I'D LEND YOU MY WHITE SUIT FOR THAT!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'LL HAVE MY GUY AT THE CHAMBER OF COMMERCE HEAR ABOUT THIS!"
2. "I'LL BE BACK TOMORROW, AND I'LL STILL BE UPSET!"
3. "LATER, LOSER. THE CLUB HAS NACHOS AND BABES."

### c70stonerdude



#### Delivered

Delivery Shift: the order arrived in good time.

1. "WHOA. THE TACO CAME TO ME. FAR OUT."
2. "RIGHT ON, BROTHER. YOU'RE A LIFESAVER."
3. "WHOA, IT'S WARM. LIKE A HUG. A LONG HUG."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "RIGHT ON THE MAT. THAT WAS SO GOOD I GOT TINGLY."
2. "WHOA. DEAD CENTER. I FELT THAT IN MY BELLY BUTTON."
3. "BULLSEYE, MAN. I GOTTA GO LIE DOWN WITH THIS."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD, MAN. I'M EATIN' IT IN THE BATHTUB ANYWAY."
2. "MY MUNCHIES WENT AND CAME BACK. TWICE."
3. "I WAITED SO LONG I MADE OUT WITH MY COUCH."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "YOU OVERBAKED FRABJOUS DINGUS!"
2. "IT'S IN THE BUSHES. I'LL EAT IT THERE. NO SHAME."
3. "ON THE ROOF?! THAT'S WHERE I KEEP MY... NOTHING."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! I SAW MY WHOLE LIFE. IT WAS MOSTLY NACHOS."
2. "DUDE! YOU MADE ME WET MY... BELL BOTTOMS!"
3. "HEY! I'M NAKED UNDER THIS PONCHO, MAN! RESPECT!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY VAN! THAT'S WHERE THE MAGIC HAPPENS, MAN!"
2. "YOU HIT MY CAR, MAN. NOW I'M ALL TENSE. AND STICKY."
3. "BUMMER! THAT DENT GOT IN MY PERSONAL SPACE, MAN."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "NACHOS, MAN. LIKE, A WHOLE LOT OF NACHOS."
2. "I FORGOT WHY I CAME IN. OH RIGHT. TACOS."
3. "NACHOS, MAN. EXTRA CHEESE. I WANNA BATHE IN IT."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "AW, MAN, YOU'RE HARSHING MY MUNCHIES!"
2. "I'M SO HUNGRY I COULD LICK THE COUNTER. I MIGHT."
3. "MY STOMACH'S SLOSHIN' LIKE MY WATERBED, MAN."

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS IS EXACTLY WHAT THEY WANT US TO DO - WAIT!"
2. "WHOA, A LINE. I LOVE LINES. NO I DON'T. HURRY."
3. "THIS LINE'S LONGER THAN MY LAST SHOWER. IN MARCH."

#### Wrong

Kitchen Shift: a wrong pick.

1. "WHOA, DID I JUST WITNESS A CRIME AGAINST TACOS?"
2. "DON'T BUM ME OUT, BROTHER!"
3. "WRONG ONE. YOU GOT HANDS LIKE MY OLD LADY AT A DRIVE-IN."

#### Served

Kitchen Shift: a ticket was served.

1. "WHOA. I JUST WITNESSED A TACO MIRACLE."
2. "NO BUM VIBES HERE. THAT'S PERFECT, MAN."
3. "BEAUTIFUL, MAN. I'M TAKIN' IT HOME TO GET WEIRD."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT, MAN. I WANNA MARRY IT. LIKE, LEGALLY."
2. "WHOA. THAT'S BETTER THAN MY WATERBED, AND MY WATERBED RULES."
3. "SPOTLESS! I'LL REMEMBER THIS FOR LIKE, TEN MINUTES!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "WHATEVER, MAN. I GOT A BAG OF CHEESE IN MY PANTS."
2. "I'M LEAVING, MAN. WAIT, WHICH WAY IS OUT?"
3. "THIS PLACE IS A BAD TRIP, MAN. LATER."

### c70newsman2



#### Delivered

Delivery Shift: the order arrived in good time.

1. "STOP THE PRESSES! IT ARRIVED ON TIME!"
2. "THIS GETS A GLOWING COLUMN, MY FRIEND."
3. "HEADLINE: LOCAL TACO ARRIVES HOT. FRONT PAGE!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "EXTRA! EXTRA! DRIVER HITS DOORMAT DEAD CENTER!"
2. "DEAD CENTER! THAT'S PULITZER-GRADE TOSSING!"
3. "SPIKE THE LEAD STORY! THIS TOSS IS THE NEWS!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD FOOD. THAT'S YESTERDAY'S NEWS, BUSTER."
2. "I'M RUNNING A CORRECTION: YOU'RE A SLOWPOKE."
3. "LATER THAN THE SUNDAY EDITION, YOU BUM!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "OH, THE HUMANITY!"
2. "HEADLINE: IDIOT THROWS DINNER IN THE HEDGE!"
3. "THAT'S GOING ON THE OBITUARY PAGE. MY BURRITO'S."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "YOU NEARLY MADE ME THE LEAD STORY, YOU MANIAC!"
2. "I'VE GOT YOUR PLATE NUMBER AND A PRINTING PRESS!"
3. "RECKLESS DRIVER STRIKES AGAIN! QUOTE ME, JACKASS!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CAR! THAT'S A HIT-AND-RUN AND A HIT PIECE!"
2. "I'LL PRINT YOUR NAME IN 72-POINT TYPE, BUB!"
3. "YOU DENTED MY DATSUN? THIS GOES ABOVE THE FOLD!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "DEADLINE AT FIVE. ONE COMBO BURRITO!"
2. "QUICK, I'M ON DEADLINE AND OUT OF IDEAS."
3. "SOFT TACO, AND DON'T QUOTE ME ON THAT."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "YOU'RE SLOWER THAN A TURTLE IN A NORTHER!"
2. "MY EDITOR'S GONNA HAVE MY HIDE, PAL!"
3. "I'VE WRITTEN TWO EDITORIALS WAITIN' ON YOU!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS LONGER THAN THE CLASSIFIEDS!"
2. "SOURCES CONFIRM: THIS LINE HASN'T MOVED. AT ALL."
3. "I'M FILING A STORY ON THIS LINE. IT'S A TRAGEDY."

#### Wrong

Kitchen Shift: a wrong pick.

1. "HOLY MOLY! THIS IS AN ABOMINATION!"
2. "THAT'S A MISPRINT, PAL! RUN A RETRACTION!"
3. "FACT CHECK: THAT'S NOT MY ORDER, YOU HACK!"

#### Served

Kitchen Shift: a ticket was served.

1. "THE REVIEW IS IN, AND IT IS A RAVE."
2. "I'LL TEACH THIS TACO IN MY SEMINAR."
3. "ACCURATE AND ON DEADLINE. I'LL RUN IT."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FRONT PAGE! BANNER HEADLINE! PERFECT TACO!"
2. "THIS IS THE STORY OF MY CAREER, KID! FLAWLESS!"
3. "I'M HOLDING THE PRESSES FOR THIS TACO, BABY!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'LL WRITE A COLUMN SO DEVASTATING YOUR KIDS WILL FEEL IT!"
2. "I'LL BE UNPACKING THIS IN MY SEMINAR ON PERSONAL POWER!"
3. "NO COMMENT. EXCEPT YOU STINK. PRINT THAT."

### c70womanwithbigsungla



#### Delivered

Delivery Shift: the order arrived in good time.

1. "WELL. I SUPPOSE I WON'T CALL CORPORATE."
2. "MY SEVEN CATS AND I ACCEPT THIS DELIVERY."
3. "ON TIME. I'LL TELL MY CATS YOU TRIED."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER. WELL. I'LL WRITE CORPORATE A NICE ONE."
2. "RIGHT ON THE MAT. EVEN MISTER FLUFFY IS IMPRESSED."
3. "HMPH. PERFECT. DON'T LET IT GO TO YOUR HEAD, DEAR."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD! I'M CALLING CORPORATE AND YOUR MOTHER!"
2. "MY CATS HAVE STARVED WAITING. WELL, ONE IS FAT."
3. "LATE AND COLD. I'LL HAVE YOUR JOB AND YOUR CAR."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "I'LL SMACK YOU WITH MY PURSE, SEE IF I DON'T!"
2. "IN MY ROSES?! YOU WILL PAY FOR EVERY THORN!"
3. "ON THE ROOF! SHALL I SEND A CAT UP AFTER IT?"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HOW DARE YOU! SEVEN CATS DEPEND ON ME!"
2. "I'M CALLING THE POLICE, YOUR MANAGER AND MY LAWYER!"
3. "I'LL HAVE YOUR LICENSE IN A FRAME, YOU HOODLUM!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY LINCOLN! YOU'LL BE PAYING FOR THIS TILL YOU DIE!"
2. "YOU HIT MY CAR. WITH MY CATS IN IT. YOU MONSTER!"
3. "I'VE MEMORIZED YOUR PLATE. AND YOUR FACE. AND YOUR SMELL."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I'LL BE TIMING YOU, DEAR. DON'T TEST ME."
2. "SOFT TACO SUPREME. NOT SOFTER. NOT HARDER."
3. "HARD TACO SUPREME. I'LL KNOW IF YOU SKIMP."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I WANT TO SPEAK TO YOUR MANAGER'S MANAGER!"
2. "I DEMAND THE MANAGER, THE REGIONAL MANAGER, AND CORPORATE!"
3. "THE DEVIL IS IN THIS PLACE AND HIS NAME IS SLOW SERVICE!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I HAVE SEVEN CATS WHO ARE MORE PUNCTUAL THAN THIS KITCHEN!"
2. "WHO IS IN CHARGE OF THIS CATTLE DRIVE?!"
3. "I DID NOT COME HERE TO STAND BEHIND PEASANTS!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "WRONG! I SAW THAT. CORPORATE WILL SEE IT TOO."
2. "EXCUSE ME?! DO I LOOK LIKE I ORDERED THAT?!"
3. "PUT THAT DOWN, YOU INCOMPETENT LITTLE TOAD!"

#### Served

Kitchen Shift: a ticket was served.

1. "FINALLY, SOMEONE COMPETENT. MY COMPLIMENTS."
2. "TELL YOUR MANAGER I'M NOT ANGRY. TODAY."
3. "ACCEPTABLE. I'M ONLY WRITING ONE LETTER."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT. I'M TELLING CORPORATE TO GIVE YOU A RAISE!"
2. "FLAWLESS, DEAR. I MAY LEAVE YOU A CAT IN MY WILL."
3. "WELL! THE FIRST THING IN TEN YEARS I CAN'T FAULT."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "MARK MY WORDS, THIS SHOP WILL RUE THE DAY!"
2. "EXPECT A LETTER. EXPECT SEVERAL. EXPECT MY LAWYER."
3. "I'M GOING HOME TO MY CATS. THEY APPRECIATE ME."

### c70bellbottomguy



#### Delivered

Delivery Shift: the order arrived in good time.

1. "BRENDA! GET OUT HERE, THE TACOS CAME!"
2. "NOW THAT'S DOING IT RIGHT. COOL, MAN."
3. "RIGHT ON TIME, MAN! BRENDA OWES ME FIVE BUCKS!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "BRENDA! DID YOU SEE THAT?! DEAD ON THE MAT!"
2. "THAT'S LEVEL AND PLUMB, MAN! PERFECT!"
3. "OUTTA SIGHT! I'D POUR A SLAB FOR THAT TOSS!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "THIS WOULDN'T HAPPEN AT SIZZLER!"
2. "BRENDA'S BEEN YELLIN' AT ME FOR AN HOUR, YOU BUM!"
3. "COLD AS MY CONCRETE AND TWICE AS HARD, MAN!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "NOT COOL, MAN. NOT COOL AT ALL."
2. "IN THE BUSHES! BRENDA, GET THE RAKE!"
3. "ON MY FRESH SLAB?! THAT'S IN THERE FOREVER NOW!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! YOU ALMOST PUT ME IN MY OWN FOUNDATION!"
2. "HEY! I'M A FAMILY MAN, YOU MANIAC! SORT OF!"
3. "I'LL PUT MY WORK BOOT THROUGH YOUR GRILLE, JACKASS!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY TRUCK! BRENDA, GET THE LICENSE NUMBER!"
2. "YOU HIT MY MIXER! I'LL POUR CONCRETE IN YOUR SEATS!"
3. "THAT'S MY MAILBOX! I SET THAT POST MYSELF, YOU BUM!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "MY CONCRETE'S SETTING WITHOUT ME! MOVE IT!"
2. "BRENDA'S IN THE CAR. TWO SOFT TACOS, QUICK!"
3. "I GOT A SLAB TO POUR AT ONE. HUSTLE!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I COULD'VE STRUCK OIL IN THE BACK FORTY BY NOW!"
2. "BRENDA'S HONKIN' THE HORN AND IT'S YOUR FAULT!"
3. "I'VE POURED CONCRETE FASTER!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I'LL GIVE YOU MY LUCKY TWO-DOLLAR BILL TO SKIP THE LINE!"
2. "THIS LINE'S HARDER TO MOVE THAN WET CEMENT!"
3. "BRENDA'S GONNA LEAVE ME FOR SOMEBODY IN THIS LINE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "NOT COOL, MAN! WRONG ONE! BRENDA HATES THAT!"
2. "WHOA, YOU'RE POURIN' THE WRONG MIX, BUDDY!"
3. "YOU BUILD TACOS LIKE MY BROTHER-IN-LAW BUILDS DECKS!"

#### Served

Kitchen Shift: a ticket was served.

1. "BETTER THAN MY MOTHER-IN-LAW'S. DON'T TELL HER."
2. "COOL, MAN. REAL COOL. BRENDA WILL LOVE IT."
3. "SOLID, MAN. LIKE A GOOD FOOTING."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "BRENDA! THIS GUY'S A GENIUS! GET IN HERE!"
2. "PERFECT! I'M NAMING MY NEXT PATIO AFTER YOU!"
3. "SPOTLESS, MAN! THAT'S BETTER THAN MY WEDDING DAY!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "BRENDA! GET IN THE CAR, WE'RE GOING TO PIZZA HUT!"
2. "BRENDA, START THE CAR! WE'RE EATIN' AT HOME AGAIN!"
3. "FORGET IT, MAN! I GOT CONCRETE TO POUR AND NO LUNCH!"

### c70foxylady



#### Delivered

Delivery Shift: the order arrived in good time.

1. "SHE ORDERED. SHE RECEIVED. SHE IS PLEASED."
2. "WHY, I DO DECLARE. AN ANGEL WITH A BAG."
3. "SHE IS FED. SHE IS FABULOUS. SHE THANKS YOU."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD ON THE MAT! DARLING, THAT WAS DIVINE!"
2. "SHE SAW THAT TOSS. SHE IS DEEPLY MOVED."
3. "OH, DARLING! THE SEXIEST THROW IN KANSAS!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "SHE WAITED. SHE AGED. SHE IS NOT AMUSED."
2. "COLD? DARLING, I'M NOT THE ONLY ICE QUEEN HERE NOW."
3. "LATE! THAT'S MERCURY'S FAULT, BUT I BLAME YOU!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "MOTHER OF GOD AND ALL THE SAINTS!"
2. "WHY, I DO DECLARE!"
3. "IN THE GARDENIAS?! YOU CLUMSY BRUTE!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "DARLING! YOU NEARLY RUINED THESE LEGS! INSURED!"
2. "SHE WAS WALKING. YOU NEARLY KILLED HER. SHE IS FURIOUS."
3. "WATCH WHERE YOU'RE GOING, YOU HAIRY OAF!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CONVERTIBLE! I'LL HAVE YOUR HEAD ON A PLATTER!"
2. "SHE PARKED. YOU HIT IT. SHE WILL DESTROY YOU."
3. "THAT'S A NEW DENT, DARLING, AND A NEW ENEMY."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "DARLING, I HAVE A PARTY. MAKE IT FABULOUS."
2. "ONE TACO, PLEASE. AND MAKE IT DRAMATIC."
3. "SOFT TACO SUPREME, DARLING. I'M LATE FOR MY ENTRANCE."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "CURSE YOU AND YOUR SLOW HANDS!"
2. "MERCURY IS IN RETROGRADE AND I KNEW THIS WOULD HAPPEN!"
3. "SAINT ANTHONY, PATRON OF LOST THINGS, PLEASE FIND MY ORDER!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "SHE DOES NOT WAIT IN LINES. SHE IS WAITING IN ONE."
2. "DARLING, THIS LINE IS RUINING MY MASCARA."
3. "SAINT JUDE, PATRON OF LOST CAUSES: THIS LINE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "NOT THAT, DARLING! DO I LOOK LIKE A PLAIN BEAN?"
2. "SHE SAID SUPREME. SHE GOT TRASH. SHE IS LIVID."
3. "WRONG! MERCURY IS IN RETROGRADE AND SO ARE YOU!"

#### Served

Kitchen Shift: a ticket was served.

1. "SAINT ANTHONY FOUND MY ORDER AT LAST!"
2. "MERCURY IS DIRECT, AND SO IS THIS TACO."
3. "PERFECTION, DARLING. ALMOST AS GOOD AS ME."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "SHE ORDERED. SHE WAS STUNNED. SHE WILL RETURN."
2. "SPOTLESS! DARLING, I COULD KISS THE CHEF. I MIGHT."
3. "FLAWLESS! THE SAINTS THEMSELVES COULDN'T DO BETTER."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "SHE CAME IN FOR A MEAL. SHE LEFT WITH NOTHING BUT DISAPPOINTMENT."
2. "SHE IS LEAVING. SHE WILL NOT LOOK BACK. GOODBYE."
3. "DARLING, I'VE BEEN STOOD UP BY BETTER MEN THAN YOU."

### c70bowlcutkid



#### Delivered

Delivery Shift: the order arrived in good time.

1. "WOW! I'M TELLING MY MOMMY YOU'RE THE BEST!"
2. "YEEHAW! FASTEST DRIVER IN THE WEST!"
3. "ON TIME! YOU'RE FASTER THAN MY BIG BROTHER!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "WHOA! RIGHT ON THE MAT! DO IT AGAIN!"
2. "BULLSEYE, PODNER! YOU COULD LASSO A JACKRABBIT!"
3. "THAT WAS THE COOLEST THING I EVER SAW! EVER!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "IT'S FINE. I'M FINE. WE'RE ALL FINE HERE, NOW."
2. "MAY THE FORCE BE WITH YOU, BECAUSE THE SPEED CLEARLY ISN'T!"
3. "IT'S COLD! MY MOM SAYS YOU'RE A SLOWPOKE!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "GOOD GRIEF! GOOD GRIEF, I SAY!"
2. "I'M TELLING MY MOMMY!"
3. "YOU THREW IT IN THE DOG'S YARD, YOU DUMMY!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HEY! I'M ON MY BIKE! I'M TELLIN' MY DAD!"
2. "WATCH IT, MISTER! YOU ALMOST SQUISHED ME!"
3. "SLOW DOWN, YOU BIG DUMMY! MOM! MOM!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YOU HIT MY DAD'S CAR! YOU'RE GONNA GET IT!"
2. "YOU BROKE OUR MAILBOX! I'M TELLIN' THE SHERIFF!"
3. "MY BIKE! YOU SMOOSHED MY BIKE, YOU BIG JERK!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "MY MOM GAVE ME A DOLLAR! ONE TACO, PODNER!"
2. "I RODE MY BIKE HERE ALL BY MYSELF!"
3. "ONE TACO, PODNER! I SAVED MY ALLOWANCE!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "DRAW, PODNER! DRAW, I SAY! QUICKER THAN THAT!"
2. "THIS IS TAKIN' FOREVER AND A DAY!"
3. "I'M GONNA STARVE AND THEN YOU'LL BE SORRY!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS LONGER THAN THE LAST DAY OF SCHOOL!"
2. "IS IT MY TURN YET? HOW 'BOUT NOW? NOW?"
3. "MY LEGS ARE TIRED! I'M SITTIN' ON THE FLOOR!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "JIMINY CHRISTMAS!"
2. "Y'ALL ARE UNDER ARREST FOR IMPERSONATIN' A TACO SHOP!"
3. "EW! NOT THAT! THAT'S GROSS, MISTER!"

#### Served

Kitchen Shift: a ticket was served.

1. "JIMINY! THAT'S THE BEST TACO EVER MADE!"
2. "I'M GONNA BE A TACO MAN WHEN I GROW UP!"
3. "THAT'S A REAL COWBOY TACO, PODNER! THANKS!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "WOW! YOU'RE MY HERO! CAN I HAVE YOUR AUTOGRAPH?"
2. "PERFECT! I'M GONNA BE JUST LIKE YOU, MISTER!"
3. "YIPPEE! BEST TACO IN THE WHOLE WIDE WEST!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M GOIN' HOME! I'M TELLIN' EVERYBODY AT RECESS!"
2. "FINE! I'LL EAT A PEANUT BUTTER SANDWICH!"
3. "YOU'RE A BIG MEANIE! I'M NEVER COMIN' BACK!"

### c70truckdriver



#### Delivered

Delivery Shift: the order arrived in good time.

1. "NO SMOKEY IN SIGHT AND STILL HOT. NICE."
2. "YOU'D MAKE A FINE TEAMSTER, KID."
3. "HOT GRUB, RIGHT ON TIME. TEN-FOUR, GOOD BUDDY."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! YOU BACKED THAT IN LIKE A PRO!"
2. "WE GOT US A REAL ACE ON THIS STREET, BUDDY!"
3. "RIGHT ON THE MAT! I'D LET YOU DRIVE MY RIG!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "MY RIG'S IDLING OUT THERE AND SO AM I, FRIEND!"
2. "COLD GRUB. I'VE HAD WARMER COFFEE IN WYOMING."
3. "SLOWER THAN A SCALE HOUSE ON A HOLIDAY, BUDDY."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE DITCH! YOU JACKKNIFED MY DINNER, BUDDY!"
2. "YOU THREW IT LIKE A FOUR-WHEELER IN A SNOWSTORM!"
3. "ON THE ROOF?! I AIN'T CLIMBIN' NOTHIN', YOU BUM!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT, YOU SKINNY LITTLE FOUR-WHEELER!"
2. "I'VE PULLED BIGGER BUGS OFF MY GRILLE THAN YOU!"
3. "YOU DRIVE LIKE YOU GOT A DEATH WISH, GOOD BUDDY!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YOU HIT MY RIG?! THAT'S LIKE A FLY KICKIN' A COW!"
2. "THAT'S MY PICKUP, YOU POTHOLE WITH A LICENSE!"
3. "I'M GONNA PARK MY RIG ON YOUR LITTLE CAR, PAL!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "RIG'S IDLING. TWO BEEF BURRITOS TO GO!"
2. "HAULING WHEAT TO SALINA. FEED ME FAST."
3. "BEAN BURRITO TO GO. I GOT FOUR HOURS ON THE CLOCK."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I'M BURNIN' DIESEL OUT THERE, BUDDY. HURRY!"
2. "COME ON! MY LOGBOOK'S LYIN' FOR ME AS IT IS!"
3. "I'VE MADE FASTER TIME CROSSIN' NEBRASKA!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "WE'RE GOING TO OVERTIME WITH THIS TACO, AREN'T WE?"
2. "I BEEN HAULING THIS HUNGER FOR SIX STATES!"
3. "I'VE SAT AT RAILROAD CROSSINGS THAT MOVED FASTER!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "WRONG LOAD, BUDDY! CHECK YOUR MANIFEST!"
2. "THAT AIN'T MY ORDER, YOU LUG-NUT BRAIN!"
3. "NEGATIVE, GOOD BUDDY! THAT'S A BIG FAT NEGATORY!"

#### Served

Kitchen Shift: a ticket was served.

1. "SIX STATES HUNGRY, AND THIS FIXED IT."
2. "BEST GRUB BETWEEN DENVER AND K.C., FRIEND."
3. "THAT'LL HOLD ME CLEAR TO GOODLAND. THANKS."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT! YOU'D MAKE ONE HELL OF A TRUCK STOP COOK!"
2. "SPOTLESS! I'M TELLIN' EVERY TRUCKER ON CHANNEL 19!"
3. "FLAWLESS! I'D HAUL YOU TO THE COAST FOR FREE!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M TAKING MY BUSINESS TO THE TACO JOHN'S DOWN THE STREET!"
2. "SMOKEY'S GOT NOTHIN' ON ME - TEN-NINE-NINE THIS TACO OUT!"
3. "I'M BACK ON I-70. EAT MY DUST, PAL!"

### c70flightattendant



#### Delivered

Delivery Shift: the order arrived in good time.

1. "WELCOME ABOARD! AND RIGHT ON SCHEDULE."
2. "MR. WHISKERS AND I ARE DELIGHTED, DEAR."
3. "RIGHT ON TIME, DEAR. A SMOOTH LANDING."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "A PERFECT LANDING, DEAR! THE CAPTAIN WOULD SWOON!"
2. "DEAD CENTER! MR. WHISKERS IS APPLAUDING!"
3. "OH MY! RIGHT ON THE MAT! YOU MAY DEPLANE A HERO!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "I'VE EATEN WITH JULIA CHILD, AND SHE WOULD NEVER!"
2. "COLD, DEAR. LIKE THE CHICKEN ON A RED-EYE."
3. "WE'VE BEEN CIRCLING FOR AN HOUR, YOU LITTLE TOAD!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "OH YOU LITTLE STINKER!"
2. "IN THE HEDGE! THAT'S A CRASH LANDING, YOU IDIOT!"
3. "ON THE ROOF?! WHAT AM I, A PILOT?!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "OH! YOU NEARLY RAN OVER MY GOOD STOCKINGS!"
2. "SLOW DOWN! I SURVIVED TURBULENCE FOR THIS?!"
3. "PLEASE REMAIN IN YOUR LANE, YOU DANGEROUS TWIT!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CAR! OH, YOU LITTLE SON OF A- DEAR. DEAR, DEAR."
2. "YOU HIT MY CAR! PLEASE LOCATE YOUR NEAREST LAWYER!"
3. "THAT'S A DENT, DEAR. AND YOU'RE GROUNDED. FOREVER."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I HAVE A LAYOVER, DEAR. DO BE QUICK."
2. "FASTEN YOUR APRON, DEAR. ONE SANCHO."
3. "COMBO BURRITO, DEAR. I'M DUE IN DENVER AT SIX."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "CABIN TO TACO BOY, COME IN TACO BOY!"
2. "OH, DO GET ON WITH IT, DEAR!"
3. "MR. WHISKERS WILL NOT BE PLEASED!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS WOULDN'T FLY IN HOUSTON!"
2. "WE'RE HOLDING ON THE RUNWAY, PEOPLE. AGAIN."
3. "THIS LINE IS WORSE THAN COACH ON A FULL FLIGHT!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "NO, DEAR. THAT'S NOT THE MEAL I SELECTED."
2. "WRONG! I'D HAVE YOU WALK THE AISLE IN DISGRACE!"
3. "PUT THAT DOWN, DEAR. GENTLY. AND WALK AWAY."

#### Served

Kitchen Shift: a ticket was served.

1. "JULIA CHILD WOULD APPROVE, DEAR. TRULY."
2. "NOW THIS WOULD FLY IN HOUSTON, DEAR."
3. "LOVELY, DEAR. BETTER THAN FIRST CLASS."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "SPOTLESS, DEAR! I'M GIVING YOU WINGS! REAL ONES!"
2. "PERFECT! YOU'D BE THE TOAST OF HOUSTON, DEAR!"
3. "OH, MR. WHISKERS IS GOING TO PURR ALL NIGHT!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "THIS FLIGHT IS CANCELLED, DEAR. I'M OFF."
2. "I'VE HAD BETTER SERVICE ON A CROP DUSTER!"
3. "MR. WHISKERS AND I ARE DEPLANING. GOODBYE!"

### c80aerobics



#### Delivered

Delivery Shift: the order arrived in good time.

1. "HOT AT THE DOOR! I'LL DO EXTRA SIT-UPS."
2. "WELL! SOMEBODY IN THIS TOWN HUSTLES."
3. "HOT BAG, HOT BOD. WE'RE BOTH WINNING TODAY."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! NOW THAT'S A CORE WORKOUT, HON!"
2. "AND HOLD IT! HOLD IT! BEAUTIFUL FORM, DRIVER!"
3. "ON THE MAT! I'D GIVE YOU A GOLD STAR AND A BACKRUB."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "NO PAIN, NO GAIN - AND SO FAR IT'S ALL PAIN AND ZERO TACOS!"
2. "I SWEATED OFF FOUR POUNDS WAITING FOR THIS!"
3. "COLD NACHOS? I DID 200 JUMPING JACKS FOR THIS?!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE JUNIPERS?! YOU LEOTARD-RIPPING LUMMOX!"
2. "AND FIVE, SIX, SEVEN... YOU MISSED, JACKASS!"
3. "IT'S IN THE GUTTER AND MY HIPS DON'T BEND THAT FAR!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! I'M JOGGING HERE, YOU MANIAC!"
2. "I'VE GOT LEG WARMERS, NOT A DEATH WISH!"
3. "THAT'S MORE CARDIO THAN I SIGNED UP FOR, YOU CREEP!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "THAT'S MY HUSBAND'S CHEVETTE! HE'LL CRY LIKE A BABY!"
2. "YOU DENTED MY BUMPER! I'LL HIGH-KICK YOUR HEADLIGHTS OUT!"
3. "MY MAILBOX! I JUST PAINTED THAT, YOU SWEATY GOON!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I JUST DID AN HOUR OF HIGH KICKS. FEED ME."
2. "TWO HARD TACOS. MY CLASS STARTS AT ONE."
3. "SOFT TACO, HON. I'VE GOT A 5:30 FULL OF HOUSEWIVES."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "GET WITH THE PROGRAM, JETHRO!"
2. "I WANT TO SPEAK TO YOUR MANAGER. NOW."
3. "I HAVEN'T HAD MY BOX OF WINE TODAY AND I'M LOSING IT!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I NEED TO BREATHE THROUGH THIS - BUT I CAN'T, I'M HUNGRY!"
2. "MY LEOTARD IS RIDING UP AND SO IS MY TEMPER!"
3. "THIS LINE IS LONGER THAN MY FRIDAY COOL-DOWN!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "NO SOUR CREAM! DO YOU WANT ME IN SWEATPANTS?!"
2. "WRONG MOVE, SWEETIE! GRAPEVINE LEFT AND TRY AGAIN!"
3. "THAT'S NOT MY ORDER, YOU FLABBY-ARMED FRY JOCKEY!"

#### Served

Kitchen Shift: a ticket was served.

1. "NOW THAT IS WORTH THE CALORIES, HON."
2. "I'LL TELL THE WHOLE CHURCH. NICELY."
3. "NOW THAT'S A REWARD FOR 300 CRUNCHES."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FAST AND PERFECT! YOU'RE MY KIND OF STAMINA!"
2. "THAT'S A TEN! A PERFECT TEN! I'M TELLING THE GIRLS!"
3. "GIVE ME A T! GIVE ME AN A! ...JUST GIVE ME A HUG!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M PUTTING THIS IN THE CHURCH BULLETIN!"
2. "I'M DONE! I'M GOING HOME TO MY BOX OF WINE!"
3. "AND STEP, AND TOUCH, AND OUT THE DOOR! BYE, LOSER!"

### c80breaker



#### Delivered

Delivery Shift: the order arrived in good time.

1. "YO, THAT TOSS HAD MOVES! RESPECT."
2. "SPIN ON THAT, DRIVER! RIGHT ON THE MAT!"
3. "HOT BAG ON THE STEP! YOU GOT FLAVOR, DRIVER!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! THAT'S A FREEZE, BABY! HOLD IT!"
2. "YO! THAT BAG DID A WINDMILL AND STUCK IT!"
3. "ON THE MAT! YOU JUST WON THE BATTLE, SON!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "I COULD GET A TACO FASTER ON THE F TRAIN AT 3 AM!"
2. "MY GRANDMA WOULD WEEP AT THIS SERVICE!"
3. "THIS BURRITO'S COLDER THAN A SUBWAY BENCH, MAN!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE BUSHES?! YOU GOT NO RHYTHM, CHUMP!"
2. "YOU TOSS LIKE YOUR ELBOWS ARE ON BACKWARDS!"
3. "THE ROOF?! WHAT, I GOTTA SPIN UP THERE NOW?!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "YO! I WAS POPPING, NOT TRYING TO GET DROPPED!"
2. "WATCH IT! YOU ALMOST FLATTENED MY CARDBOARD!"
3. "BACK OFF MY SIDEWALK, YOU BUCKET-DRIVING BOZO!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY BOOMBOX WAS ON THAT HOOD, YOU JERK!"
2. "THAT'S MY COUSIN'S CAR! HE'S GONNA SPIN ON YOUR HEAD!"
3. "YOU DENTED MY RIDE! YOU OWE ME A FENDER AND NEW KICKS!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "GOTTA EAT BEFORE I HIT THE CARDBOARD!"
2. "BATTLE AT THE ROLLER RINK IN TEN, MAN!"
3. "TWO HARD TACOS! MY CREW'S WAITING IN THE LOT!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "MY WIFE IS IN LABOR! SHE WANTS A TACO! IT'S HER ONE REQUEST!"
2. "I COULD'VE DONE A THOUSAND BACKSPINS BY NOW!"
3. "YO, THIS AIN'T A SLOW JAM! SPEED IT UP, MAN!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE AIN'T MOVING! SOMEBODY BREAK IT UP!"
2. "I'VE SEEN BETTER FLOW OUT A CLOGGED HYDRANT!"
3. "BACK OF THE LINE? YO, I'M BASICALLY IN NEBRASKA!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU CHIMICHANGA-CHEEKED CHUMP!"
2. "I AM BREAKING MY FAST FOR THIS?!"
3. "NAH NAH NAH! THAT'S OFF THE BEAT, MAN!"

#### Served

Kitchen Shift: a ticket was served.

1. "THAT'S FRESH! STRAIGHT-UP FRESH!"
2. "MY CREW'S GONNA HEAR ABOUT THIS ONE."
3. "THAT'S DEF, COOK. STRAIGHT-UP DEF."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "YO! THAT WAS FLAWLESS! YOU GOT FOOTWORK IN YOUR HANDS!"
2. "FAST AND FRESH! I'M GONNA BREAK RIGHT HERE ON THE TILE!"
3. "COOK, YOU'RE THE B-BOY OF BURRITOS! RESPECT!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M OUT! YOU CAN'T HANG WITH MY HUNGER!"
2. "PEACE OUT, SLOWPOKE! GO EAT SOME CARDBOARD!"
3. "FORGET THIS. I'LL GO SPIN ON THE MALL FLOOR HUNGRY!"

### c80dad



#### Delivered

Delivery Shift: the order arrived in good time.

1. "DOLORES! THE TACOS ARE HERE! AND HOT!"
2. "ATTA BOY. WISH MY KIDS MOVED THAT FAST."
3. "HOT AND ON TIME. DON'T TELL DOLORES I TIPPED."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "RIGHT ON THE WELCOME MAT! KIDS, THAT'S HUSTLE!"
2. "DEAD CENTER! SON, YOU SHOULD BE PITCHING FOR THE ROYALS."
3. "WELL I'LL BE DAMNED. DOLORES, COME LOOK AT THIS!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "IT'S COLD! I COULD'VE DRIVEN TO WICHITA AND BACK!"
2. "THE KIDS ATE THE COUCH CUSHIONS WAITING FOR YOU, PAL!"
3. "I'M DOCKING YOUR TIP LIKE YOU'RE ONE OF MY KIDS!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "THAT'S MY LAWN! I EDGE THAT LAWN EVERY SATURDAY!"
2. "IN THE GUTTER? I JUST CLEANED THAT GUTTER, KNUCKLEHEAD!"
3. "OH, THAT'S JUST GREAT. NOW THE DOG'S EATING DINNER."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "SLOW DOWN! THERE ARE KIDS ON THIS STREET! MINE!"
2. "HEY! I'LL COME DOWN THERE AND TAKE YOUR KEYS, HOTSHOT!"
3. "WATCH THE SPRINKLER, YOU SON OF A- ...SLOW DOWN!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY WAGON! I'VE HAD THAT WAGON SINCE OUR SECOND KID!"
2. "MY MAILBOX! I SET THAT POST IN CONCRETE, DAMMIT!"
3. "I'M WRITING DOWN YOUR PLATE AND CALLING YOUR MOTHER!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "FAMILY OF FIVE. THE KIDS ARE IN THE WAGON."
2. "SIX BEAN BURRITOS. DON'T ASK ME WHY SIX."
3. "FOUR HARD TACOS. THE KIDS ARE FIGHTING IN THE CAR."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I HAVE BEEN A LOYAL CUSTOMER SINCE NINETEEN HUNDRED AND SEVENTY-TWO!"
2. "I LEFT THE MINIVAN RUNNING. WITH THE DOG IN IT!"
3. "I HAVE A CARSEAT IN MY CAR WITH A CRYING BABY! GIVE ME MY TACOS!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I COULD BUILD A BETTER TACO SHOP IN TWENTY MINUTES!"
2. "I'VE BEEN IN SHORTER LINES FOR GAS IN '79!"
3. "THIS LINE IS WHY I DRINK, DOLORES!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "NO, NO. I SAID BEAN. WHO TAUGHT YOU TO LISTEN?"
2. "WRONG! AND I SAID IT SLOW, LIKE I DO FOR MY SON!"
3. "THAT'S NOT IT, CHAMP. I'M NOT MAD. I'M DISAPPOINTED."

#### Served

Kitchen Shift: a ticket was served.

1. "NOW THAT'S A TACO A MAN CAN RESPECT."
2. "TELL YOUR FATHER HE RAISED A GOOD COOK."
3. "GOOD WORK. TASTES LIKE A FIRM HANDSHAKE."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS! SON, I WISH YOU WERE MY SON!"
2. "FAST AND PERFECT! THE FAMILY EATS HERE FOREVER NOW!"
3. "NOW THAT'S A WORK ETHIC! I'M GONNA CRY IN THE WAGON."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M CANCELLING THE FAMILY VACATION OVER THIS!"
2. "BOY. BOY. WAIT'LL I TELL DOLORES ABOUT THIS ONE."
3. "KIDS! IN THE WAGON! WE'RE HAVING CEREAL FOR DINNER!"

### c80preppy



#### Delivered

Delivery Shift: the order arrived in good time.

1. "WHY, HOW PERFECTLY PROMPT OF YOU!"
2. "ON THE MAT AND STILL WARM. I'M ASTONISHED."
3. "HOW NICE. I'LL MENTION YOU AT THE CLUB. VAGUELY."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER ON THE MONOGRAMMED MAT! BRAVO!"
2. "WHAT A STROKE! YOU COULD PLAY DOUBLES WITH MUFFY."
3. "THAT LANDED BETTER THAN MY FIRST MARRIAGE."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "HEAVENS TO BETSY, THIS IS JUST AWFUL!"
2. "STONE COLD. LIKE MOTHER'S EMBRACE."
3. "I'VE HAD WARMER WELCOMES FROM MY EX-HUSBAND'S LAWYER."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE BOXWOODS?! THOSE ARE IMPORTED, YOU OAF!"
2. "DID YOU LEARN TO THROW AT A PUBLIC SCHOOL?!"
3. "MY ROSES! MY PRIZE-WINNING ROSES! YOU BEAST!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "GOOD LORD! YOU NEARLY HIT ME IN MY BEST TOPSIDERS!"
2. "WATCH IT, YOU RUFFIAN! I'M WEARING CASHMERE!"
3. "YOU ANIMAL! I NEARLY SNAPPED MY PEARLS!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "THAT'S A VOLVO, YOU CRETIN! IT'S SAFER THAN YOU!"
2. "OUR LAWYER IS NAMED THURSTON AND HE BITES."
3. "DADDY GAVE ME THAT CAR! DADDY WILL HAVE YOUR HEAD!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "ONE SOFT TACO. I'M DUE AT THE CLUB AT TWO."
2. "DO HURRY, DEAR. MY TENNIS LESSON AWAITS."
3. "ONE BEAN BURRITO. AND DON'T TELL MOTHER."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I CANNOT. I SIMPLY CANNOT!"
2. "SEND MY TACO, OH LORD, SEND IT SWIFTLY!"
3. "IS THIS A KITCHEN OR A HOLDING CELL, DEAR?"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I DO NOT STAND IN LINES. I HAVE PEOPLE FOR THAT."
2. "SUCH A CRUSH OF PEOPLE. AND THE SMELL. GOOD LORD."
3. "IF THIS LINE GETS ANY LONGER I'LL NEED A CHAPERONE."

#### Wrong

Kitchen Shift: a wrong pick.

1. "THAT IS NOT WHAT I ORDERED, AND YOU KNOW IT."
2. "OH, HOW COMMON. TRY AGAIN, DEAR."
3. "WRONG! I'D SEND IT BACK TO THE KITCHEN IF YOU WEREN'T IN IT!"

#### Served

Kitchen Shift: a ticket was served.

1. "SIMPLY DIVINE. I SHALL TELL MOTHER."
2. "MY COMPLIMENTS. I DON'T GIVE THEM OFTEN."
3. "LOVELY. QUITE PRESENTABLE, ACTUALLY."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS! YOU'D MAKE A DIVINE BUTLER!"
2. "PERFECT AND PROMPT! I MAY FAINT ONTO THE CHAISE."
3. "SPLENDID! I SHALL HAVE DADDY BUY THIS PLACE."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I HAVE HALF A MIND TO - WELL, I WON'T SAY IT!"
2. "I SHAN'T BE RETURNING. I SHAN'T!"
3. "YOU'LL BE HEARING FROM MY LETTER TO THE EDITOR."

### c80valley



#### Delivered

Delivery Shift: the order arrived in good time.

1. "OH MY GOD, YOU'RE LIKE, A HERO."
2. "IT'S STILL HOT? THAT IS SO TOTALLY RAD."
3. "THAT IS SO NICE! I'M LIKE, TOTALLY TIPPING YOU."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "OH MY GOD, RIGHT ON THE MAT! MARRY ME. KIDDING. MAYBE."
2. "THAT WAS LIKE, SO PERFECT I'M LITERALLY SHAKING."
3. "YOU'RE LIKE THE BEST THING THAT HAPPENED TO ME TODAY. SAD."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "MY GRANDMOTHER IS ROLLING IN HER GRAVE AT THIS SERVICE!"
2. "THIS IS NOT MY LUCKY DAY AND YOU ARE NOT HELPING!"
3. "IT'S COLD. LIKE, AS COLD AS MY STEPMOM."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "LIKE, OH MY GOD!"
2. "MY TACO IS IN THE SPRINKLER. LIKE, WHY ARE YOU?"
3. "EW! IT'S IN THE DOG POO! YOU ARE SO DEAD!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "OH MY GOD, YOU ALMOST KILLED MY HAIR!"
2. "LIKE, HELLO?! PEDESTRIAN! WITH A FUTURE!"
3. "WATCH IT, DORK! I JUST GOT THESE LEG WARMERS!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY DAD'S CAR! HE'S GONNA, LIKE, GROUND ME TO DEATH!"
2. "YOU DENTED MY CAMARO?! YOU ARE SO TOTALLY PAYING!"
3. "OH MY GOD. OH MY GOD. YOU JERK. OH MY GOD."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "HI! I NEED NACHOS, LIKE, IMMEDIATELY."
2. "MY MOM'S DOUBLE-PARKED AND SHE'S FREAKING."
3. "ONE SANCHO? NO, TWO. NO - OKAY, LIKE, ONE."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I LITERALLY CANNOT DEAL RIGHT NOW!"
2. "HELLO, I'M LIKE, AGING BACK HERE?!"
3. "THIS IS SO BORING I COULD, LIKE, DO HOMEWORK."

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS LIKE, LONGER THAN MY PHONE CORD!"
2. "EW, THE GUY IN FRONT TOTALLY SMELLS LIKE FEET."
3. "IF I STAND HERE MUCH LONGER MY PERM IS GONNA FALL."

#### Wrong

Kitchen Shift: a wrong pick.

1. "I'M SO SURE."
2. "UM, NO? DID I SAY THAT? I DID NOT SAY THAT."
3. "EW! ARE YOU, LIKE, BLIND OR JUST A TOTAL DORK?"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS IS LIKE, THE BEST TACO EVER. EVER."
2. "OKAY, I TAKE BACK LIKE, HALF OF IT."
3. "OKAY, THIS IS LIKE, SO GOOD IT'S UNFAIR."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "OH MY GOD, YOU ARE LIKE A TACO GENIUS! SERIOUSLY!"
2. "THAT WAS SO FAST! I'M TELLING EVERYONE AT THE MALL!"
3. "PERFECT! I'M, LIKE, SO HAPPY I COULD SCREAM!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "OKAY, I'M LIKE, SO OUT OF HERE. BYE, LOSER."
2. "I'M CALLING MY BEST FRIEND AND WE'RE TALKING ABOUT YOU."
3. "THIS PLACE IS TOTALLY GROSS AND SO ARE YOU!"

### c80newwaveguy



#### Delivered

Delivery Shift: the order arrived in good time.

1. "YOU ARRIVED LIKE A SYNTH SOLO. ON CUE."
2. "A WARM BAG IN A COLD WORLD. HOW RARE."
3. "A TACO ON TIME. AT LAST, SOMETHING IS RIGHT."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER. SO BEAUTIFUL I FELT A FEELING."
2. "ON THE MAT. LIKE A PERFECTLY PROGRAMMED DRUM MACHINE."
3. "THAT TOSS WAS MORE ROMANTIC THAN MY LAST GIRLFRIEND."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "I'D WEEP, BUT MY TEARS WOULD BE OVER-SALTED."
2. "COLD. LIKE MY HEART. LIKE MY FATHER."
3. "LATE AND COLD. I WORE EYELINER FOR NOTHING."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE HEDGE. HOW TERRIBLY, TERRIBLY TYPICAL."
2. "YOU THREW MY DINNER INTO THE VOID, YOU PHILISTINE."
3. "MY BURRITO IS ON THE ROOF. SO IS MY WILL TO LIVE."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT! YOU NEARLY FLATTENED MY HAIR, YOU BRUTE!"
2. "GO ON THEN, RUN ME OVER. SEE IF I CARE. I DO CARE!"
3. "I WANTED TO DIE YOUNG. NOT ON A TUESDAY, YOU PRAT!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YOU HIT MY MOPED! IT WAS THE ONLY THING THAT LOVED ME!"
2. "MY CAR WAS BLACK. NOW IT'S BLACK AND DENTED, YOU OAF."
3. "I'LL WRITE A DEPRESSING SONG ABOUT YOUR BUMPER!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "ONE SANCHO. AND SOMETHING FOR THE ENNUI."
2. "I MUST EAT BEFORE MY SYNTH WARMS UP."
3. "A SOFT TACO. SOFT, LIKE THE DARKNESS."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "STUFF IT, METALLICA BREATH!"
2. "I HAVE LIVED FOUR HUNDRED YEARS. THIS IS THE LONGEST I'VE WAITED."
3. "I'VE WAITED SO LONG MY HAIR GEL HAS GONE OFF."

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS LIKE LIFE: LONG AND POINTLESS."
2. "SO MANY PEOPLE. ALL OF THEM WEARING BEIGE."
3. "STANDING IN LINE WITH NORMAL PEOPLE. MY NIGHTMARE."

#### Wrong

Kitchen Shift: a wrong pick.

1. "TAKE ME TO YOUR TACO MAKER. WAIT - NEVER MIND. I JUST MET HIM."
2. "THAT ISN'T MINE. NOTHING EVER IS."
3. "WRONG, YOU FEATHER-HAIRED MOUTH-BREATHER."

#### Served

Kitchen Shift: a ticket was served.

1. "I SHALL STEAL THE VERY SOUL OF THIS RESTAURANT!"
2. "EXQUISITE. I MAY WEAR LESS BLACK TOMORROW."
3. "AT LAST, A TACO THAT UNDERSTANDS ME."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT. I'M SMILING. DON'T LOOK. DON'T LOOK!"
2. "SO FLAWLESS I MAY BUY A SHIRT THAT ISN'T BLACK."
3. "YOU'RE A GENIUS. A TORTURED GENIUS. LIKE ME."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "RIGHT THEN. RIGHT. THEN."
2. "I'M LEAVING. NO ONE WILL NOTICE. NO ONE EVER DOES."
3. "GOODBYE, CRUEL TACO SHOP. GOODBYE, CRUEL WORLD. ...LATER."

### c80gijoefan



#### Delivered

Delivery Shift: the order arrived in good time.

1. "PACKAGE SECURED! OUTSTANDING WORK, DRIVER!"
2. "DIRECT HIT ON THE LANDING ZONE! HOO-AH!"
3. "RATIONS RECEIVED, HOT AND ON SCHEDULE! CARRY ON!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "BULL'S-EYE ON THE LZ! I'M PUTTING YOU IN FOR A MEDAL!"
2. "DEAD CENTER! THAT'S SPECIAL FORCES ACCURACY, SOLDIER!"
3. "PERFECT DROP! I'D FOLLOW YOU INTO ANY WAR ZONE!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD CHOW! I'VE HAD WARMER MRES IN A SNOWBANK!"
2. "LATE?! IN COMBAT YOU'D BE DEAD, PRIVATE!"
3. "YOU'RE SO SLOW THE ENEMY RETIRED, MAGGOT!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "MAN DOWN! MAN DOWN! MY BURRITO IS IN THE SHRUBS!"
2. "YOU MISSED THE TARGET BY A COUNTRY MILE, GRUNT!"
3. "THAT'S FRIENDLY FIRE ON MY PETUNIAS, YOU TRAITOR!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "INCOMING! HIT THE DECK! YOU MANIAC!"
2. "ENEMY VEHICLE! I'M TAKING DOWN YOUR PLATES!"
3. "YOU RECKLESS NUMBSKULL! I'M CALLING IN AN AIR STRIKE!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YOU RAMMED MY JEEP! THAT'S AN ACT OF WAR!"
2. "MY MAILBOX WAS A FORWARD OUTPOST, YOU SABOTEUR!"
3. "YOU DENTED MY RIDE! PREPARE FOR A COURT-MARTIAL!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "REQUESTING RATIONS! SIX HARD TACOS!"
2. "I'M ON A SUPPLY RUN. MAKE IT SNAPPY!"
3. "SOLDIER! TWO CHILI BURRITOS, ON THE DOUBLE!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I HAVE A BUNKER FULL OF MRES AND I SHOULD'VE STAYED THERE!"
2. "IS THIS A KITCHEN OR A POW CAMP?!"
3. "I'VE DUG FOXHOLES FASTER THAN YOU MAKE A TACO!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I SHALL NOT REST UNTIL MY TACO IS IN HAND!"
2. "THIS LINE IS A QUAGMIRE! WE'RE PINNED DOWN!"
3. "WE NEED REINFORCEMENTS AT THE COUNTER, STAT!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "DON'T BE SUCH A SPAZ!"
2. "YOU PINTO BEAN PEABRAIN!"
3. "YOU'RE ABOUT AS USEFUL AS A SCREEN DOOR ON A SUBMARINE!"

#### Served

Kitchen Shift: a ticket was served.

1. "MISSION ACCOMPLISHED. AT EASE, COOK."
2. "THAT IS A TACO FIT FOR THE TROOPS!"
3. "CHOW'S UP! A FINE MEAL FOR A FIGHTING MAN!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS EXECUTION! YOU'RE PROMOTED TO SERGEANT!"
2. "FAST AND PERFECT! THAT'S A TEXTBOOK OPERATION!"
3. "HOO-AH! COOK, I'D TAKE A BULLET FOR THESE NACHOS!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "RETREAT! RETREAT! THIS POSITION IS LOST!"
2. "I'M GOING AWOL, AND I'M TAKING MY APPETITE!"
3. "THIS MISSION IS SCRUBBED! I'M OUTTA HERE, MAGGOT!"

### c80metalhead



#### Delivered

Delivery Shift: the order arrived in good time.

1. "HAIL THE DRIVER! THE BAG HATH LANDED!"
2. "RIGHT ON THE PORCH! YOU RULE, DUDE!"
3. "HOT BAG, NO DELAY! YOU'RE A METAL GOD, DRIVER!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! THAT TOSS WAS PURE SHRED!"
2. "ON THE MAT! I'M THROWING THE HORNS AT YOU, MAN!"
3. "PERFECT LANDING! IT'S LIKE A GUITAR SOLO WITH CHEESE!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "MY FOREMAN'S GONNA HAVE MY HIDE!"
2. "IT'S COLDER THAN MY VAN IN FEBRUARY, DUDE!"
3. "LATE?! I COULD'VE TUNED MY GUITAR SIX TIMES!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "BITE THE BIG ONE, TACO FUMBLER!"
2. "IN THE HEDGE?! YOU SLAYED MY DINNER, POSER!"
3. "MY NACHOS ARE ON THE ROOF, YOU SPANDEX-LESS DWEEB!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! YOU ALMOST TOTALED MY BATTLE JACKET, DUDE!"
2. "YO! I'M CROSSING, YOU TACO-SLINGING TURD!"
3. "YOU NEARLY CRUSHED MY CASSETTES, YOU SNIVELING DORK!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CAMARO! YOU'RE DEAD MEAT, DUDE! DEAD! MEAT!"
2. "YOU DENTED MY VAN! THAT'S THE WIZARD MURAL, MAN!"
3. "I'LL HANG YOUR BUMPER ON MY WALL LIKE A TROPHY!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "CHILI CHEESE NACHOS! FOR THE HORDE!"
2. "I GOT TEN MINUTES BEFORE MY SHIFT, MAN!"
3. "CHILI ENCHILADA, DUDE. I GOT BAND PRACTICE."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "WHERE'S MY TACO, YOU BARNACLE-ENCRUSTED SWINE?!"
2. "COME ON, DUDE! MY HAIR'S GETTING LONGER BACK HERE!"
3. "MOVE IT, YOU SLUG-SLOW SPATULA SLINGER!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS DOOM! PURE DOOM, MAN!"
2. "ALL THESE POSERS IN FRONT OF ME. UNREAL."
3. "I'M GONNA START A MOSH PIT TO GET TO THE FRONT!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "PREPARE TO MEET THY MAKER, TACO VARLET!"
2. "TO BE THE TACO, YOU GOTTA BEAT THE TACO! YOU AIN'T BEATIN' NOTHIN'!"
3. "THAT AIN'T IT, DUDE! THAT'S TOTALLY BOGUS!"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS TACO SHREDS! TOTALLY METAL!"
2. "I SHALL SING OF THIS CHILI BURRITO!"
3. "NOW THAT CHILI BURRITO KICKS ASS, MAN!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "YOU ARE THE GUITAR GOD OF BURRITOS, DUDE!"
2. "TOTAL ANNIHILATION OF MY HUNGER! RULES!"
3. "FASTER THAN A SPEED METAL SOLO! HAIL, COOK!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I HEREBY CURSE THIS SHOP WITH STALE CHIPS FOR A THOUSAND YEARS!"
2. "THIS PLACE SUCKS, MAN. I'M OUTTA HERE!"
3. "YOU HAVE DISHONORED THE HORDE! WE RIDE!"

### c80arcadekid



#### Delivered

Delivery Shift: the order arrived in good time.

1. "WHOA, BONUS ROUND! YOU'RE ACE, MAN!"
2. "PERFECT LANDING! THAT'S A NEW HIGH SCORE!"
3. "HOT TACOS! THAT'S A POWER-UP, MAN!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "BULL'S-EYE! YOU GET TEN THOUSAND POINTS!"
2. "DEAD CENTER! I'D PUT YOU ON THE HIGH SCORE TABLE!"
3. "WHOA! PERFECT! DO IT AGAIN, I WASN'T LOOKING!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "IT'S COLD! I COULD'VE BEAT TEN LEVELS BY NOW!"
2. "MY TACO RAN OUT OF LIVES WAITING FOR YOU!"
3. "I SPENT MY LAST QUARTER WAITING FOR THIS!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "YOU SNORK-FACED FLIBBERGIBBET!"
2. "YOU MISSED! THAT'S A FREE GAME FOR THE BUSHES!"
3. "IT'S IN THE TREE! HOW DO I GET IT, A JETPACK?!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HEY! I ONLY HAVE ONE LIFE, YOU DINGUS!"
2. "YOU ALMOST FROGGERED ME, YOU BUTTHEAD!"
3. "I'M TELLING MY MOM YOU DRIVE LIKE A MANIAC!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YOU HIT MY BIKE! THAT'S MY ONLY BIKE!"
2. "MY DAD'S CAR! HE'S GONNA FREAK OUT! ON YOU!"
3. "YOU BUSTED THE MAILBOX! I'M NOT GETTING BLAMED FOR THAT!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "QUICK, I GOT A QUARTER ON THE MACHINE!"
2. "NACHOS, PLEASE! MY MOM'S IN THE CAR!"
3. "TWO HARD TACOS! I GOT FIVE QUARTERS LEFT!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "GET ON WITH IT, YA DOOFUS!"
2. "I HAVE FOUGHT GALACTIC EVIL, BUT THIS IS MY TRUE NEMESIS!"
3. "HURRY UP! SOMEBODY'S GONNA TAKE MY MACHINE!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "MINE! MINE! MINE! THAT TACO IS MINE!"
2. "THIS LINE'S LONGER THAN THE ONE FOR DRAGON'S LAIR!"
3. "COME ON! I'LL BE A GROWN-UP BEFORE I GET A TACO!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "WHAT'RE YOU, NUTS?!"
2. "THIS IS A CRITICAL FAIL ON THE CUSTOMER SERVICE CHECK!"
3. "WRONG! YOU PUSHED THE WRONG BUTTON, DORK!"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS TACO IS ACE! THAT'S AN EXTRA LIFE!"
2. "I'D PUT MY INITIALS ON THIS TACO."
3. "RADICAL! I'M EATING THIS AT THE MACHINE!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT RUN! YOU DIDN'T LOSE A SINGLE LIFE!"
2. "YOU'RE THE TACO CHAMPION OF THE WHOLE ARCADE!"
3. "THAT WAS SO FAST! ARE YOU A ROBOT? COOL!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "FORGET IT! I'M SPENDING MY TACO MONEY ON GALAGA!"
2. "YOU STINK! YOU STINK AT TACOS!"
3. "I'M TELLING EVERYBODY AT SCHOOL THIS PLACE IS LAME!"

### c80videostoreclerk



#### Delivered

Delivery Shift: the order arrived in good time.

1. "NOW THAT'S A SATISFYING ENDING."
2. "FIVE STARS. NO, SIX. I'M ALLOWED."
3. "ON TIME AND STILL WARM. I'D RENT YOU AGAIN."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! THAT'S A DIRECTOR'S CUT TOSS!"
2. "ON THE MAT! I'M RUNNING THAT BACK IN SLOW-MO!"
3. "BULL'S-EYE! FRAME BY FRAME, THAT WAS FLAWLESS."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "HE'S DEAD, JIM. AND BY 'HE' I MEAN MY APPETITE."
2. "YOU'RE LATER THAN MY WORST RETURNS. LATE FEE!"
3. "THIS DELIVERY HAD MORE DEAD AIR THAN AN ART FILM."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE HEDGE? THAT'S A STRAIGHT-TO-VIDEO TOSS."
2. "YOU THREW IT ON THE ROOF. WORST PLOT TWIST EVER."
3. "MISSED! THAT TOSS GOES IN THE BARGAIN BIN, BUDDY."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! I'M NOT A STUNT DOUBLE, YOU MANIAC!"
2. "THIS ISN'T A CAR CHASE MOVIE, YOU JACKASS!"
3. "HEY! I'M CARRYING TWELVE OVERDUE TAPES HERE!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YOU DINGED MY HATCHBACK! THAT'S A HORROR MOVIE, PAL!"
2. "MY MAILBOX! I'M ADDING YOU TO THE BANNED LIST!"
3. "YOU HIT MY CAR? I'M CHARGING YOU A LATE FEE FOR LIFE!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "QUICK SANCHEZ. THE NEW RELEASES CAME IN."
2. "I'M ON BREAK. THE RETURNS WON'T SHELVE THEMSELVES."
3. "BEAN BURRITO TO GO. I'M MISSING THE FRIDAY RUSH."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "SORRY, BUT UH, SORRY, THIS IS TAKING QUITE A BIT, HUH?"
2. "I'VE SAT THROUGH THREE-HOUR EPICS FASTER THAN THIS."
3. "IS THIS BURRITO BEING SHOT ON LOCATION?"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS WORSE THAN NEW RELEASE NIGHT!"
2. "EVERYBODY IN HERE OWES A LATE FEE, I SWEAR."
3. "THIS LINE HAS MORE EXTRAS THAN A ROMAN EPIC!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU COULDN'T FOLD A BURRITO WITH A MAP AND A TUTORIAL!"
2. "REVIEW THE TAPE! REVIEW THE TAPE!"
3. "WRONG! THAT'S THE SEQUEL NOBODY ASKED FOR!"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS IS GOING ON MY STAFF PICKS SHELF."
2. "A STRONG SEQUEL TO LAST WEEK'S TACO."
3. "GOOD. FOUR STARS. THE SALSA WAS A STANDOUT."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FAST AND FLAWLESS! THAT'S BEST PICTURE, BABY!"
2. "I'D GIVE THIS A STANDING OVATION IF MY KNEES WORKED."
3. "PERFECT. CUT! PRINT IT! THAT'S A WRAP!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "TWO THUMBS DOWN! WAY DOWN! NEVER AGAIN!"
2. "I'LL TAKE 'PLACES I'M NEVER COMING BACK TO' FOR FIVE HUNDRED!"
3. "I'M WALKING OUT. LIKE AT A BAD MIDNIGHT SHOWING."

### c80valleysurfer



#### Delivered

Delivery Shift: the order arrived in good time.

1. "RIGHT ON, BRAH! TOTALLY TUBULAR TOSS!"
2. "DUDE, IT'S STILL WARM. STOKED!"
3. "WARM GRUB, BRAH! YOU'RE A TOTAL LIFEGUARD."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "WHOA! YOU SHOT THE CURL RIGHT ONTO THE MAT!"
2. "DEAD CENTER, DUDE! DAVE, DID YOU SEE THAT?!"
3. "THAT TOSS WAS LIKE A PERFECT BARREL, BRAH."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "BOGUS, BRAH. TOTALLY BOGUS."
2. "IT'S COLDER THAN THE PACIFIC IN JANUARY, BRAH."
3. "DUDE. I GOT A SUNBURN WAITING. IN KANSAS."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE BUSHES, BRAH? YOU TOTALLY WIPED OUT!"
2. "DAVE! THE TACOS ARE IN THE POOL! ...WE DON'T HAVE A POOL!"
3. "THAT'S A KOOK TOSS, DUDE. TOTAL KOOK."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! YOU ALMOST DROPPED IN ON ME, BRAH! NOT COOL!"
2. "HEY, DUDE! I'M NOT A SPEED BUMP, YOU HODAD!"
3. "SLOW DOWN, YOU GROMMET-BRAINED BARNEY!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY VAN! DAVE'S GONNA BE SO BUMMED, BRAH!"
2. "YOU DINGED MY WOODIE! THAT'S LIKE, A HERITAGE CAR!"
3. "DUDE, YOU HIT MY MAILBOX. HARSH. SO HARSH. JERK."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "SURF'S FLAT IN KANSAS, BRAH. TACO TIME."
2. "DAVE, I'M ORDERING FOR YOU TOO, MAN!"
3. "TWO SANCHOS, BRAH. DAVE SAYS THREE. DAVE'S BROKE."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "CRIKEY, WHAT'S THE HOLD-UP?!"
2. "WHATCHA GONNA DO, BROTHER, WHEN MY HUNGER RUNS WILD ON YOU?!"
3. "BRAH, I'VE WAITED FOR WAVES SHORTER THAN THIS."

#### Queue

Kitchen Shift: the line is past three customers.

1. "DAVE, YOU'RE NOT GONNA BELIEVE WHERE I'M STILL STANDING!"
2. "THIS LINE IS FLATTER THAN THE KANSAS OCEAN, BRAH."
3. "DAVE, SAVE ME A SPOT. NO, DAVE, LIKE, A REAL SPOT."

#### Wrong

Kitchen Shift: a wrong pick.

1. "WHOA, BRAH, THAT'S NOT MY ORDER. TOTAL WIPEOUT."
2. "NO, DUDE! THAT'S DAVE'S. I'M THE OTHER GUY!"
3. "HARSH, BRAH. YOU GOT CHEESE FOR BRAINS."

#### Served

Kitchen Shift: a ticket was served.

1. "THIS VIBE IS RANCID, BRAH."
2. "THIS VIBE IS RADICAL NOW, BRAH."
3. "GNARLY TACO, DUDE. THE GOOD GNARLY."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "DUDE! THAT WAS RADICAL! YOU'RE THE BIG KAHUNA!"
2. "PERFECT RIDE, BRAH! ZERO WIPEOUTS!"
3. "WHOA, I'M TOTALLY STOKED! DAVE'S CRYING, MAN!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "LATER, BRAH. THIS SPOT IS BLOWN OUT."
2. "I'M PADDLING OUT, DUDE. YOU'RE A TOTAL BARNEY."
3. "DAVE, WE'RE OUTTA HERE. THIS PLACE IS SO BOGUS."

### c80yuppiegirl



#### Delivered

Delivery Shift: the order arrived in good time.

1. "ON TIME AND ON BUDGET. I LIKE YOU."
2. "FINALLY, SOMEONE WHO RESPECTS A DEADLINE."
3. "PUNCTUAL. I'M PUTTING YOU IN MY ROLODEX."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER. I'D PROMOTE YOU OVER HALF MY TEAM."
2. "ON THE MAT! THAT'S WHAT I CALL A CLEAN CLOSE."
3. "BULL'S-EYE. YOU'RE WASTED IN DELIVERY, SWEETIE."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "LATE. YOU JUST COST ME A CLIENT AND A WARM BURRITO."
2. "I BILL NINETY AN HOUR. YOU OWE ME, PAL."
3. "COLD FOOD IS A BREACH OF CONTRACT, MISTER."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE AZALEAS?! I'LL HAVE YOU FIRED BY FIVE!"
2. "MY DINNER IS ON THE ROOF, AND SO IS YOUR TIP."
3. "MISSED THE TARGET. AND MISSED TARGETS GET CUT."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT! THESE HEELS COST MORE THAN YOUR CAR!"
2. "YOU NEARLY HIT ME! MY LAWYER EATS DRIVERS LIKE YOU!"
3. "HEY! I'M POWER WALKING HERE, YOU HALFWIT!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY BMW! YOU'D BETTER HAVE GOOD INSURANCE, BUSTER!"
2. "YOU DENTED MY SAAB?! THAT'S A LAWSUIT ON WHEELS!"
3. "THAT BUMPER COSTS MORE THAN YOUR WHOLE FAMILY, PAL."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "TWO SOFT TACOS. I HAVE A ONE O'CLOCK."
2. "I'M PENCILED IN FOR TEN MINUTES. GO."
3. "ONE CHILI SANCHO. I CLOSE A MERGER AT TWO."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "TIME IS MONEY AND YOU ARE LOSING ME MONEY!"
2. "I HAVE MY FILOFAX OPEN AND MY BLOCK IS BOOKED!"
3. "I'VE GOT A CONFERENCE CALL AND YOU'VE GOT NOTHING!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE HAS LESS HUSTLE THAN A GOVERNMENT OFFICE."
2. "I'M BILLING EVERYONE IN THIS LINE FOR MY TIME."
3. "WHO DO I HAVE TO SLEEP WITH TO GET A TACO HERE?"

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOUR NAME, YOUR BOSS'S NAME, AND HIS BOSS'S NAME. NOW!"
2. "WHAT FRESH HELL IS THIS?!"
3. "WRONG. THAT'S A FIREABLE OFFENSE IN MY OFFICE."

#### Served

Kitchen Shift: a ticket was served.

1. "EFFICIENT. I'M PENCILING YOU IN AGAIN."
2. "THIS IS THE BEST DEAL I'VE CLOSED ALL DAY."
3. "ACCEPTABLE. I'LL EXPENSE IT."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS! YOU'RE GETTING A BONUS AND A CORNER OFFICE!"
2. "FAST AND RIGHT! FINALLY, SOMEONE COMPETENT IN THIS TOWN!"
3. "PERFECT! I'M SO PLEASED I MIGHT TAKE A FULL LUNCH."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M TAKING THIS TO THE BOARD!"
2. "I'M GOING TO CALL CHANNEL 7 ABOUT THIS!"
3. "I'M TAKING MY BUSINESS TO A COMPETITOR. GOODBYE."

### c80newromantic



#### Delivered

Delivery Shift: the order arrived in good time.

1. "OH, HOW TERRIBLY ROMANTIC. A WARM TACO."
2. "SPLENDID TOSS! I SHALL WRITE YOU AN ODE."
3. "DIVINE. YOU'VE QUITE RESTORED MY FAITH, DARLING."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! DARLING, THAT WAS POSITIVELY OPERATIC!"
2. "ON THE MAT! I'VE GONE ALL FLUSHED UNDER MY ROUGE."
3. "WHAT GRACE! I'D LET YOU DO MY MAKEUP."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "I NO LONGER BELIEVE IN A BENEVOLENT GOD!"
2. "COLD. LIKE A NIGHT IN A DRAFTY CASTLE."
3. "LATE, DARLING. MY FRILLY SHIRT HAS WILTED."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "BLOODY NORA!"
2. "IN THE ROSES?! YOU UNCOUTH LUMP!"
3. "OH, YOU GORMLESS PILLOCK! IT'S ON THE ROOF!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "MIND THE CAPE, YOU HOOLIGAN!"
2. "YOU NEARLY RUINED MY HAIR, YOU VANDAL!"
3. "WATCH IT! I'M FAR TOO PRETTY TO BE ROADKILL!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CAR! THAT WAS VINTAGE, YOU PHILISTINE!"
2. "OH, BLOODY HELL! YOU'VE SCUFFED MY BUMPER, YOU OAF!"
3. "YOU'VE DENTED MY MOTOR! I SHALL SUE IN THREE COUNTRIES!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "A SANCHO, DARLING. I'M MEETING THE BAND."
2. "QUICKLY NOW. MY HAIR WON'T HOLD ALL DAY."
3. "SOFT TACO, DARLING. MY EYELINER'S STILL WET."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "MIRROR, MIRROR, ON THE WALL - WHERE IS MY TACO, AFTER ALL?!"
2. "I'M AGING, DARLING. VISIBLY. UNDER THIS LIGHTING!"
3. "GET A MOVE ON, YOU SHUFFLING TWIT!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "QUEUING IN FRILLS IS FRIGHTFULLY HOT, DARLINGS."
2. "THIS QUEUE HAS LESS STYLE THAN A BUS DEPOT."
3. "MOVE ALONG! I HAVE A VIDEO SHOOT AT DUSK!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU FOPDOODLE!"
2. "BOB'S YOUR UNCLE? WELL YOUR UNCLE IS RUBBISH, SUNSHINE!"
3. "NOT THAT, YOU BLITHERING BUFFOON!"

#### Served

Kitchen Shift: a ticket was served.

1. "BRILLIANT. ABSOLUTELY BRILLIANT, DARLING."
2. "I'M QUITE MOVED. MY EYELINER IS RUNNING."
3. "EXQUISITE. I'LL WEAR IT ON MY SHIRT, PROBABLY."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECTION! I COULD KISS YOU, BUT MY LIPSTICK..."
2. "FAST AND FLAWLESS! YOU'RE AN ABSOLUTE STAR, DARLING!"
3. "MAGNIFICENT! I SHALL DEDICATE MY NEXT SINGLE TO YOU!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M FLOUNCING OUT, DARLING. WATCH ME FLOUNCE."
2. "GOOD DAY TO YOU! AND I MEAN THAT RUDELY!"
3. "CHEERIO, YOU HOPELESS PRAT. TA-TA!"

### c80jock



#### Delivered

Delivery Shift: the order arrived in good time.

1. "TOUCHDOWN! RIGHT IN THE END ZONE, BUDDY!"
2. "NOW THAT'S A CANNON ARM! NICE TOSS!"
3. "HOT GRUB! THAT'S A FIRST DOWN, BUDDY!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "SPIRAL RIGHT ON THE MAT! YOU'RE MY QUARTERBACK!"
2. "NOTHING BUT NET! YOU GOT HOPS, SKIPPY!"
3. "DEAD CENTER! COACH WOULD START YOU, BRO!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD?! I'VE HAD WARMER ICE BATHS, YOU BENCHWARMER!"
2. "TOO LATE, SKIPPY! FLAG ON THE PLAY!"
3. "YOU'RE SLOWER THAN OUR KICKER WITH A HANGOVER!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "YOU THREW AN INTERCEPTION TO MY HEDGE, ZERO!"
2. "AIRBALL! IN THE BUSHES! YOU THROW LIKE A WET NOODLE!"
3. "IT'S ON THE ROOF, BONEHEAD! THAT'S A SAFETY!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! I'LL TACKLE THAT CAR, YOU MEATHEAD!"
2. "YOU ALMOST CLIPPED ME! THAT'S A PERSONAL FOUL!"
3. "WATCH IT, DORK! I GOT A GAME FRIDAY!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY TRANS AM! I'M GONNA PUT YOU THROUGH A LOCKER!"
2. "YOU DENTED MY TRUCK, YOU LITTLE DWEEB! SWIRLY TIME!"
3. "MY MAILBOX! IT WAS SHAPED LIKE A FOOTBALL, MAN!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "THREE CHILI BURRITOS. I'M BULKING!"
2. "PRACTICE IN TWENTY! LET'S HUSTLE, SKIPPY!"
3. "SANCHEZ AND NACHOS. WE GOT TWO-A-DAYS, BRO."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "DID I STUTTER, SKIPPY?!"
2. "I'M MISSING TIPOFF, YOU FUMBLING LINEBACKER!"
3. "DOUBLE TIME! TRIPLE TIME! ANY TIME BUT THIS TIME!"
4. "MY CARB-LOADING IS RUINED!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE'S LONGER THAN WIND SPRINTS!"
2. "COME ON! WE'RE STACKED UP LIKE A GOAL-LINE STAND!"
3. "SOMEBODY CALL A TIMEOUT. I'M STARVING HERE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "VINCE LOMBARDI WOULD BENCH YA FOR THIS!"
2. "ARE YOU BIDDING FOR THE TITLE OF WORST TACO SHOP?!"
3. "WRONG PLAY, SKIPPY! RUN IT AGAIN!"

#### Served

Kitchen Shift: a ticket was served.

1. "THAT'S A WINNER, COACH! HIGH FIVE!"
2. "MY CARB-LOADING IS BACK ON TRACK!"
3. "NOW THAT'S A CHAMPIONSHIP BURRITO!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "TOUCHDOWN! YOU'RE GOING TO STATE, COOK!"
2. "SOMEBODY DUMP THE WATER COOLER ON THIS COOK!"
3. "MVP! MVP! COOK, YOU'RE THE MVP!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "AND THAT, SPORTS FANS, IS HOW YOU LOSE A CUSTOMER!"
2. "I'M OUTTA HERE! GAME OVER, LOSERS!"
3. "WALKING OFF THE FIELD. YOU FORFEIT, CHUMP!"

### c80actionhero



#### Delivered

Delivery Shift: the order arrived in good time.

1. "MISSION COMPLETE. THE PACKAGE IS SAFE."
2. "YOU DRIVE LIKE A HERO. I APPROVE."
3. "PACKAGE DELIVERED. NOBODY GOT HURT. THIS TIME."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER. YOU'VE GOT THE EYE OF A SNIPER, KID."
2. "ON THE MAT. IN SLOW MOTION. WITH A FIREBALL BEHIND IT."
3. "PERFECT DROP. YOU'RE MY NEW PARTNER. DON'T DIE ON ME."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "YOU'RE LATE. IN MY LINE OF WORK, LATE MEANS DEAD."
2. "COLD. LIKE MY EX-WIFE. LIKE MY EX-PARTNER."
3. "I COULD'VE SAVED THE WORLD TWICE IN THAT TIME."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "YOU MISSED. NOW I GO INTO THE BUSHES. ALONE."
2. "THE ROOF?! I'LL HAVE TO RAPPEL UP FOR MY DINNER!"
3. "MISSED THE TARGET. YOU'RE A LIABILITY, ROOKIE."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "TRY THAT AGAIN, PUNK. I DARE YOU."
2. "I DODGED THAT LIKE A GRENADE, YOU AMATEUR!"
3. "I'VE BEEN RUN OFF THE ROAD BY BETTER DRIVERS, CLOWN!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YOU HIT MY CAR. NOW IT'S PERSONAL."
2. "MY MAILBOX! YOU JUST STARTED A WAR, MISTER!"
3. "MY TRUCK! I'LL RIP YOUR BUMPER OFF WITH MY TEETH!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "THERE'S A NEW SHERIFF IN TOWN, AND HIS NAME IS STARVIN' MARVIN!"
2. "I NEED FUEL. BEEF NACHO SUPREME. NOW."
3. "I DO MY OWN STUNTS. I ORDER MY OWN TACOS."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "THERE'S GONNA BE A RECKONING IN THIS HERE CANTINA!"
2. "BRO, MY PUMP IS EVAPORATING!"
3. "I'M RUNNING OUT OF PATIENCE. AND I DON'T RELOAD."

#### Queue

Kitchen Shift: the line is past three customers.

1. "PAUSE. PAUSE. WHAT IS MY MOTIVATION FOR STAYING HERE?!"
2. "THIS LINE IS A HOSTAGE SITUATION. I'M NEGOTIATING."
3. "THIRTY PEOPLE. ONE COOK. I'VE SEEN WORSE ODDS."

#### Wrong

Kitchen Shift: a wrong pick.

1. "WRONG MOVE, PAL. DEAD WRONG."
2. "THAT'S NOT MY ORDER. YOU'RE COMPROMISED."
3. "CHILI? I SAID NO CHILI. THE MISSION IS FAILING!"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS TACO JUST SAVED THE DAY."
2. "MY MUSCLES THANK YOU, COOK. ALL OF THEM."
3. "THIS IS WHAT I FIGHT FOR."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FAST AND FLAWLESS. I'M GONNA FLEX ABOUT THIS."
2. "YOU'RE A MACHINE, COOK. A BEAUTIFUL TACO MACHINE."
3. "PERFECT. I'D LIFT A TRUCK OVER MY HEAD FOR YOU."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "TONIGHT, I DINE IN HELL... BECAUSE I'M CLEARLY NOT EATING HERE!"
2. "I'LL BE BACK. AND I'LL BE HUNGRY. AND I'LL BE ANGRY."
3. "I'M OUTTA HERE. AND I'M TAKING THE DOOR WITH ME."

### c80girlrocker



#### Delivered

Delivery Shift: the order arrived in good time.

1. "WHOA! THAT TOSS TOTALLY ROCKED!"
2. "STILL HOT? YOU'RE MY HERO, DRIVER!"
3. "WARM AND ON TIME! YOU GET A BACKSTAGE PASS!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! THAT TOSS HAD MORE NERVE THAN MY DRUMMER!"
2. "RIGHT ON THE MAT! I'D THROW MY BRA AT YOU!"
3. "BULL'S-EYE! THAT WAS HOTTER THAN MY BASS PLAYER!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "LATE?! MY HAIR WENT FLAT WAITING, YOU JERK!"
2. "COLD NACHOS. YOU'RE AS RELIABLE AS MY EX."
3. "I'VE PLAYED ENCORES SHORTER THAN THIS WAIT!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "YOU MISERABLE LITTLE SNORF-BUCKET!"
2. "IN THE HEDGE?! YOU SPANDEX-SPLITTING NIMROD!"
3. "ON THE ROOF! THAT'S A STAGE DIVE GONE WRONG, LOSER!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT! THESE BOOTS ARE FOR KICKING, AND I'M AIMING!"
2. "HEY! YOU ALMOST RUINED TWO HOURS OF TEASING!"
3. "WHOA! LEARN TO DRIVE, YOU MOUSSE-BRAINED MORON!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY TOUR VAN! YOU'RE GONNA PAY FOR THAT, BUB!"
2. "YOU HIT MY CAR! I'LL SMASH A GUITAR ON YOUR HOOD!"
3. "MY MAILBOX! IT HAD MY BAND STICKER ON IT, JERKWAD!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "SOUR CREAM SANCHO! MY BAND'S ON AT EIGHT!"
2. "FEED ME FAST. MY HAIR TOOK TWO HOURS."
3. "CHILI CHEESE NACHOS. AND NAPKINS. THIS IS LEATHER."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "MY HAIRSPRAY IS WILTING AND SO IS MY PATIENCE!"
2. "I'M NOT GETTING ANY YOUNGER, AND NEITHER IS MY PERM!"
3. "MOVE IT, YOU SLOW-COOKING SCUZZBALL!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS WORSE THAN THE GIRLS' ROOM AT A CONCERT!"
2. "I'VE BEEN IN MOSH PITS WITH BETTER MANNERS!"
3. "IF THIS LINE GETS LONGER, I'M SELLING T-SHIRTS."

#### Wrong

Kitchen Shift: a wrong pick.

1. "GET OUTTA HERE WITH THIS - GET OUT!"
2. "*GASPS* THE SALSA... WAS MEANT FOR ME..."
3. "WRONG! YOU'RE OUT OF TUNE, COOKIE!"

#### Served

Kitchen Shift: a ticket was served.

1. "THAT'S A TACO WITH SOME ATTITUDE! LOVE IT!"
2. "ENCORE! I'LL BE BACK AFTER SOUND CHECK!"
3. "OH YEAH! THAT'S A TACO WITH A BACKBEAT!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FAST AND PERFECT! YOU'RE THE ROCK STAR, BABY!"
2. "THAT WAS TIGHTER THAN MY LEATHER PANTS!"
3. "WOO! I'M STAGE-DIVING INTO THIS BURRITO!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'LL GET YOU, MY PRETTY - AND YOUR LITTLE TACO TOO!"
2. "I'M OUTTA HERE! THIS PLACE IS SO NOT ROCK AND ROLL!"
3. "SMELL YA LATER, YOU TACO-TOUCHING TOAD!"

### c80computernerd



#### Delivered

Delivery Shift: the order arrived in good time.

1. "DELIVERY TIME WITHIN TOLERANCE. ACCEPTABLE."
2. "YOUR ARC WAS NEARLY OPTIMAL. NEARLY."
3. "ARRIVAL CONFIRMED. TEMPERATURE: NOMINAL. THANKS."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! STATISTICALLY, THAT SHOULDN'T HAPPEN!"
2. "PERFECT TRAJECTORY! I'M SAVING IT TO A FLOPPY!"
3. "ON THE MAT! I MUST PROGRAM THAT INTO MY COMMODORE!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "LATE BY A FACTOR OF THREE. ERROR. ERROR."
2. "IT'S AT ROOM TEMPERATURE. HYPOTHESIS: YOU STINK."
3. "I'VE SEEN 300 BAUD MODEMS MOVE FASTER THAN YOU!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "MISSED. YOUR AIM HAS A SYNTAX ERROR, DUNDERHEAD!"
2. "IN THE TREE?! THAT'S NOT EVEN A VALID OUTPUT!"
3. "YOU MISSED BY ELEVEN FEET. I MEASURED. JERK."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "DANGER! YOU NEARLY DELETED ME, YOU MORON!"
2. "WATCH IT! I'M CARRYING FIFTY FLOPPY DISKS!"
3. "YOU ALMOST HIT ME! I'LL HACK YOUR REPORT CARD!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY PINTO! I'VE CALCULATED THE REPAIRS. IT'S A LOT!"
2. "YOU HIT MY CAR! I'M WRITING A SCATHING BBS POST!"
3. "MY MAILBOX, YOU KNUCKLE-DRAGGING NEANDERTHAL!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "ONE HARD TACO. MY PROGRAM IS COMPILING."
2. "I ESTIMATE TWELVE MINUTES. PROVE ME WRONG."
3. "ONE SANCHEZ. MY MAINFRAME TIME IS BOOKED AT FOUR."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I COULD BUILD A ROBOT THAT MAKES TACOS FASTER THAN YOU!"
2. "YOUR EFFICIENCY RATING IS APPROACHING ZERO!"
3. "I COULD CODE A TACO IN BASIC FASTER THAN THIS!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THE CONTINENTS HAVE SHIFTED SINCE I ORDERED!"
2. "THIS QUEUE IS A FIRST-IN, NEVER-OUT SYSTEM!"
3. "THE LINE IS STUCK IN AN INFINITE LOOP!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU ABSOLUTE SCHMENDRICK!"
2. "THIS IS HIGHLY ILLOGICAL!"
3. "INCORRECT INPUT! GARBAGE IN, GARBAGE OUT!"

#### Served

Kitchen Shift: a ticket was served.

1. "OUTPUT MATCHES SPECIFICATIONS. DELIGHTFUL."
2. "THIS GETS A GLOWING ENTRY IN MY NEWSLETTER."
3. "SUCCESS. ZERO BUGS DETECTED. MOSTLY."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS EXECUTION! NOT ONE BUG IN THE CODE!"
2. "PERFECT AND FAST! I MAY HAVE TO TALK TO A GIRL!"
3. "AMAZING! I'M ADDING YOU TO MY HALL OF FAME DISK!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I WILL BE NOTING THIS IN MY NEWSLETTER."
2. "I'M ROLLING FOR INITIATIVE ON MY WALKOUT!"
3. "PROCESS TERMINATED. I'M LOGGING OFF, LOSER."

### c80breakfastclubkid



#### Delivered

Delivery Shift: the order arrived in good time.

1. "IT'S WARM. LIKE HOPE. HOW STRANGE."
2. "YOU CAME. NOBODY EVER COMES. THANKS."
3. "IT'S ON TIME. I GUESS SOMEBODY CARES. WEIRD."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "RIGHT ON THE MAT. WHOA. I FELT SOMETHING. GROSS."
2. "NATURAL TWENTY! YOU ROLLED A NATURAL TWENTY, MAN!"
3. "DEAD CENTER. YOU'RE THE ONLY ADULT WHO DOESN'T SUCK."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD. LIKE MY PARENTS' MARRIAGE."
2. "LATE. TYPICAL. NOBODY EVER SHOWS UP FOR ME."
3. "I AGED A WHOLE SEMESTER WAITING FOR THIS."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "UGH, OF COURSE. THE UNIVERSE HATES ME."
2. "IN THE GUTTER. WHERE EVERYTHING I LOVE ENDS UP."
3. "NICE THROW, JERKFACE. MY MOM'S TULIPS. GREAT."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HEY! WATCH IT! I'M ALREADY HAVING A BAD LIFE!"
2. "YOU ALMOST HIT ME! I'M TELLING THE PRINCIPAL. SOMEHOW."
3. "GO AHEAD, RUN ME OVER! IT'D GET ME OUT OF SATURDAY!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "THAT'S MY DAD'S CAR. HE'S GONNA BLAME ME. THANKS."
2. "YOU BENT MY BIKE! IT'S THE ONLY THING THAT GETS ME!"
3. "MY MAILBOX! OH GREAT, NOW I'M GROUNDED FOREVER."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I HAVE DETENTION AT THREE. FEED ME FIRST."
2. "ONE BEAN BURRITO. AND A LITTLE DARKNESS."
3. "ONE SANCHO. MY PARENTS FORGOT TO FEED ME AGAIN."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "EAT MY SHORTS, YOU TAPE-DECK REJECT!"
2. "BY THE GODS OF FAERUN, I SHALL BE FED!"
3. "EVEN THE UNDEAD HAVE SCHEDULES!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS LONGER THAN SATURDAY DETENTION."
2. "EVERYONE IN THIS LINE IS A JOCK. PERFECT. GREAT."
3. "I'VE STOOD HERE SO LONG I'M GROWING A PERSONALITY."

#### Wrong

Kitchen Shift: a wrong pick.

1. "WRONG ONE. JUST LIKE EVERYTHING ELSE IN MY LIFE."
2. "UGH. NO. ARE YOU EVEN LISTENING? NOBODY LISTENS."
3. "THAT'S A CRITICAL MISS, DUNGEON MASTER!"

#### Served

Kitchen Shift: a ticket was served.

1. "OKAY. THIS IS ACTUALLY NOT TERRIBLE."
2. "I'LL WRITE A POEM ABOUT THESE NACHOS. A NICE ONE."
3. "IT'S GOOD. DON'T MAKE IT A THING."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "WHOA. PERFECT. BEST DAY OF MY SAD LITTLE LIFE."
2. "YOU GET PLUS FIVE EXPERIENCE AND MY ETERNAL LOYALTY."
3. "FAST AND PERFECT. YOU'RE BASICALLY A WIZARD, MAN."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M PUTTING THIS IN MY POETRY JOURNAL. IN BLACK INK."
2. "WHATEVER. I'LL EAT A POP-TART IN MY ROOM. ALONE."
3. "FINE! I DIDN'T WANT TO EAT ANYWAY! I HATE YOU!"

### c80dj



#### Delivered

Delivery Shift: the order arrived in good time.

1. "AND IT LANDS ON THE MAT! THE CROWD GOES WILD!"
2. "THIS ONE GOES OUT TO MY DRIVER! ON TIME!"
3. "HOT BAG AT THE TOP OF THE HOUR! NICE, DRIVER!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "BULL'S-EYE ON THE MAT! THAT'S A NUMBER ONE SMASH!"
2. "RIGHT IN THE MIDDLE! CALLER NINE, YOU'RE A WINNER!"
3. "DEAD CENTER! I'M PUTTING THAT TOSS IN HEAVY ROTATION!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "YOU FAJITA-FOOTED FRAUD!"
2. "LATE AND COLD! THIS IS DEAD AIR, FOLKS! DEAD AIR!"
3. "I PLAYED THE LONG VERSION OF EVERY SONG WAITING!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "AND IT'S WIDE! WIDE LEFT INTO THE HEDGES, FOLKS!"
2. "OH, THE NEEDLE SKIPS! RIGHT INTO THE BUSHES!"
3. "AND THE CROWD BOOS! A BAG IN THE ROSES, YOU HACK!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! I NEARLY BECAME THE TRAFFIC REPORT, PAL!"
2. "HEY! I'LL READ YOUR PLATE ON THE AIR, YOU MENACE!"
3. "SLOW IT DOWN, HOTROD! THIS AIN'T THE INDY 500!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YOU HIT MY STATION VAN! THE WHOLE TOWN'S GONNA HEAR!"
2. "AND HE PLOWS RIGHT INTO MY BUICK! WHAT A BONEHEAD!"
3. "MY MAILBOX! THAT'S GOING ON THE NEWS AT SIX, CHUMP!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I'M ON AIR IN FIFTEEN! TACOS FOR THE BOOTH!"
2. "REQUEST LINE IS OPEN: ONE SANCHEZ, PLEASE!"
3. "SOUR CREAM SANCHO! I'VE GOT A SIX-MINUTE SONG ON!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "PLAY-ACTION TACO FAKE! HE NEVER EVEN STARTED IT!"
2. "MY COMMERCIAL BREAK ENDS IN NINETY SECONDS!"
3. "THIS WAIT IS LONGER THAN A PROG ROCK B-SIDE!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "IT'S A TRAFFIC JAM AT THE COUNTER, FOLKS!"
2. "THIS LINE RUNS LONGER THAN A PLEDGE DRIVE!"
3. "I'VE TAKEN FEWER REQUESTS ON A FRIDAY NIGHT!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "WHAT IS THIS, AMATEUR HOUR?!"
2. "OH! OH NO! HE BOBBLES THE TORTILLA! IT'S LOOSE! IT'S LOOSE!"
3. "OOH, WRONG RECORD! SCRATCH THAT, PAL!"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS TACO IS NUMBER ONE ON MY CHART!"
2. "AND THE COOK STICKS THE LANDING! WHAT A PLAY!"
3. "THAT'S A HIT! STRAIGHT TO THE TOP FORTY!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "A PERFECT GAME! THIS COOK'S GOING IN THE HALL OF FAME!"
2. "FAST AND FLAWLESS! LISTENERS, I'M CRYING ON AIR!"
3. "THIS NEXT ONE GOES OUT TO THE COOK! WOO!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M TELLING ALL MY LISTENERS ABOUT THIS!"
2. "AND THAT'S A WRAP, FOLKS! I'M SIGNING OFF!"
3. "I'M TELLING THE WHOLE TRI-COUNTY AREA, PAL!"

### c80preppyguy



#### Delivered

Delivery Shift: the order arrived in good time.

1. "SOLID EXECUTION, PAL. THE TIP IS YOURS."
2. "PROMPT. DADDY WOULD HIRE YOU."
3. "WARM AND ON TIME. YOU'D MAKE A FINE CADDY."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER. THAT'S A HOLE IN ONE, PAL!"
2. "ON THE MAT! I SHOULD RECRUIT YOU FOR CREW."
3. "SPLENDID TOSS. DADDY WOULD CALL THAT BREEDING."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "WHAT'S THE ROI ON THIS WAIT TIME, PAL?"
2. "LATE? AT THE CLUB YOU'D BE SACKED, PAL."
3. "COLD FOOD. MY ATTORNEY WILL BE IN TOUCH, CHAMP."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE HYDRANGEAS?! YOU UTTER PLEBEIAN!"
2. "IT'S ON THE ROOF, YOU STATE-SCHOOL STOOGE!"
3. "YOU MISSED BY A MILE, CHAMP. TYPICAL TOWNIE."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT, TOWNIE! THESE ARE MY GOOD LOAFERS!"
2. "YOU NEARLY CREASED MY POPPED COLLAR, YOU GOON!"
3. "SLOW DOWN! DO YOU KNOW WHO MY FATHER IS?!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY PORSCHE! DADDY'S GOING TO EXILE YOU TO TOPEKA!"
2. "YOU SCRATCHED MY JAG, YOU GREASY TOWNIE!"
3. "MY MAILBOX IS MONOGRAMMED, YOU SIMPLETON!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I HAVE A TEE TIME!"
2. "ONE SANCHO. I'M DUE ON THE BACK NINE."
3. "MY RACQUETBALL COURT IS BOOKED AT TWO."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "OF ALL THE - I JUST - UNBELIEVABLE!"
2. "MY PLEDGES COULD MAKE A TACO FASTER!"
3. "I'VE STOOD HERE SO LONG I'M LOSING MY TAN!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "IS THERE NOT A MEMBERS-ONLY LINE?"
2. "I'M STUCK BEHIND A MAN IN A BOWLING SHIRT. SAVE ME."
3. "AT YALE WE HAD A MAN FOR STANDING IN LINES."

#### Wrong

Kitchen Shift: a wrong pick.

1. "I'LL HAVE YOU KNOW MY GRANDDADDY INVENTED THE TACO!"
2. "WRONG. I'D FIRE YOU IF YOU WORKED ON THE YACHT."
3. "THAT IS NOT WHAT I ORDERED, MY GOOD MAN. AGAIN."

#### Served

Kitchen Shift: a ticket was served.

1. "THE TERROIR HERE IS OFF, I CAN SENSE IT."
2. "THE TERROIR IS SPOT ON TODAY. BRAVO."
3. "MY PLEDGES COULD LEARN FROM YOU, PAL."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS! I'M PUTTING YOU UP FOR THE CLUB!"
2. "FAST AND PERFECT. THAT'S OLD MONEY SERVICE, PAL."
3. "SUPERB! I'D BUY YOU A SAILBOAT IF I LIKED YOU MORE."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M LEAVING. HAVE YOUR MANAGER CALL MY FATHER."
2. "THIS IS BENEATH ME. MOST THINGS ARE. THIS IS LOWER."
3. "OFF TO THE CLUB. THEY HAVE A CHEF. A REAL ONE."

### c80heavymetaldude



#### Delivered

Delivery Shift: the order arrived in good time.

1. "OH YEAH, BROTHER! THAT BAG HIT THE MARK!"
2. "THE GODS OF THUNDER SMILE ON YOU, DRIVER!"
3. "THE TACO HAS ARRIVED HOT, BROTHER! GLORY!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! ODIN HIMSELF COULDN'T THROW BETTER!"
2. "ON THE MAT, BROTHER! THAT WAS A TOSS OF THUNDER!"
3. "BULL'S-EYE! I SHALL CARVE YOUR NAME INTO MY GUITAR!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "EVEN THE DEVIL WOULD HAVE MY TACO BY NOW!"
2. "I DEMAND TRIAL BY COMBAT FOR MY TACO!"
3. "COLD, BROTHER! COLDER THAN A FROST GIANT'S ARMPIT!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE SHRUBBERY?! THOU HAST DOOMED MY SUPPER!"
2. "YOU MISSED, BROTHER! FEEL THE WRATH OF THE HEADBANGER!"
3. "ON THE ROOF?! I SHALL SUMMON A DRAGON TO FETCH IT!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT, BROTHER! I'LL BODY SLAM YOUR HATCHBACK!"
2. "YOU NEARLY FLATTENED THE KING OF THE HIGHWAY, KNAVE!"
3. "SLOW YOUR CHARIOT, YOU CURSED CUR!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY VAN! YOU HAVE AWAKENED THE BEAST, BROTHER!"
2. "YOU DENTED MY RIDE! I CHALLENGE YOU TO A CAGE MATCH!"
3. "MY MAILBOX! IT WAS SHAPED LIKE A SKULL, YOU HEATHEN!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "CHILI CHEESE NACHOS! BRING THE THUNDER!"
2. "I RODE IN ON A HOWLING WIND. FEED ME!"
3. "TWO CHILI SANCHOS, BROTHER! FUEL FOR THE ROAD!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "THIS TOWN AIN'T BIG ENOUGH FOR SLOW TACOS!"
2. "BY THE BEARD OF THOR, WHERE IS MY TACO?!"
3. "MY PATIENCE WEARS THIN AS A G STRING, BROTHER!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS LONGER THAN MY GUITAR SOLOS, BROTHER!"
2. "STAND ASIDE, MORTALS! A WARRIOR MUST EAT!"
3. "WE ARE AN ARMY OF THE HUNGRY, BROTHER! RISE UP!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "THAT IS NOT MY ORDER, YOU SPINELESS SCULLION!"
2. "WRONG, BROTHER! YOU HAVE ANGERED THE METAL GODS!"
3. "BLASPHEMY! THAT ENCHILADA IS NOT MINE, WORM!"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS TACO IS PURE HEAVY METAL, BROTHER!"
2. "VICTORY! I SALUTE THEE, MIGHTY COOK!"
3. "THE BEAST IS FED! HAIL THE COOK, BROTHER!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT, BROTHER! YOU ARE A WARRIOR OF THE GRILL!"
2. "FAST AS LIGHTNING! YOU HAVE EARNED VALHALLA, COOK!"
3. "OH YEAH! A FLAWLESS PERFORMANCE, BROTHER! DIG IT!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'LL MAKE YOU DANCE THE HEMPEN JIG, YOU SALSA-SOAKED SCURVY DOG!"
2. "OH! IT'S ME, BROTHER! IT'S ME, THE GUY WHO IS LEAVING!"
3. "I RIDE OFF INTO THE STORM, BROTHER! FAREWELL!"

### c80businessman



#### Delivered

Delivery Shift: the order arrived in good time.

1. "NOW THAT'S A PRODUCTIVE DELIVERY."
2. "I'M BUYING STOCK IN YOU, KID."
3. "PROMPT AND HOT. THAT'S A SOUND INVESTMENT."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! THAT'S A HOSTILE TAKEOVER OF MY PORCH!"
2. "ON THE MAT. KID, YOU'VE GOT A FUTURE IN SALES."
3. "BULL'S-EYE! I'M MOVING YOU UP TO THE TOP FLOOR!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "I HAVE THIRTY MINUTES! I HAD THIRTY MINUTES!"
2. "MY POWER LUNCH IS TURNING INTO A POWER DINNER!"
3. "LATE! I'M DEDUCTING THE TIP AND YOUR DIGNITY."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "MY DINNER'S IN THE HEDGES. THAT'S A WRITE-OFF!"
2. "YOU MISSED, YOU AMATEUR! YOU'RE FIRED FROM MY LAWN!"
3. "ON THE ROOF?! I'LL HAVE MY SECRETARY SUE YOU!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT, PAL! I'M WORTH MORE THAN YOUR WHOLE TOWN!"
2. "YOU NEARLY HIT ME! I'VE GOT A MEETING, YOU MORON!"
3. "HEY! THIS SUIT IS ITALIAN, YOU JACKASS!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY MERCEDES! YOU'LL BE PAYING FOR THIS UNTIL 1999!"
2. "YOU HIT MY CAR?! I'LL BUY YOUR COMPANY AND FIRE YOU!"
3. "MY MAILBOX! I'M BILLING YOU FOR EVERY SPLINTER!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I'M A BUSY MAN, UNDERSTAND?"
2. "I'VE GOT A CLIENT IN THE CAR. LET'S MOVE."
3. "BEEF NACHO SUPREME. CLOSE THE DEAL FAST."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I'M LOSING A THOUSAND DOLLARS A MINUTE HERE!"
2. "YOU'RE SLOWER THAN A BEAR MARKET, PAL!"
3. "WHERE'S MY ORDER? DO I HAVE TO SEND YOU A MEMO?!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "WHAT'S YOUR TACOS-PER-MINUTE QUOTA?!"
2. "EVERYTHING'S BIGGER IN TEXAS - INCLUDING THIS WAIT!"
3. "THIS LINE IS A BOTTLENECK! WHO'S IN CHARGE HERE?!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "WRONG! THAT'S A BAD QUARTER FOR YOU, PAL!"
2. "I DIDN'T ORDER THAT. READ THE CONTRACT!"
3. "WRONG AGAIN?! THEY'D EAT YOU ALIVE ON WALL STREET!"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS IS A POWER LUNCH, AND YOU NAILED IT."
2. "BULLISH ON TACOS. VERY BULLISH."
3. "GOOD. THAT'S A PROFITABLE LUNCH."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS! I'D TAKE THIS TACO SHOP PUBLIC TOMORROW!"
2. "FAST AND PERFECT! THAT'S A RECORD QUARTER, COOK!"
3. "PERFECT! I'M SO HAPPY I MIGHT LOOSEN MY TIE!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'LL CALL CORPORATE SO HARD THEIR FAX MACHINE EXPLODES!"
2. "I'M SHORTING THIS TACO SHOP!"
3. "I'M TAKING MY BUSINESS ELSEWHERE! AND MY EXPENSE ACCOUNT!"

### c80punkrocker



#### Delivered

Delivery Shift: the order arrived in good time.

1. "OKAY. THAT WAS PRETTY PUNK OF YOU."
2. "YOU BEAT THE MAN TO MY DOOR. RESPECT."
3. "HOT FOOD, NO HASSLE. NOT BAD FOR A WAGE SLAVE."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER. I HATE HOW MUCH I LIKE THAT."
2. "ON THE MAT?! THAT'S ANARCHY! GLORIOUS ANARCHY!"
3. "BULL'S-EYE. YOU'RE TOO PUNK FOR THIS JOB, MATE."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "LATE AND COLD. JUST LIKE THE SYSTEM."
2. "SO LATE MY MOHAWK WILTED, YOU GIT!"
3. "COLD BURRITO. THANKS, YOU CORPORATE TACO STOOGE."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE HEDGE! YOU TOTAL TOSSPOT!"
2. "ON THE ROOF?! I'LL HAVE TO CLIMB UP LIKE A RAT!"
3. "YOU MISSED, YOU SPOTTY-FACED POSER!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "OI! WATCH IT, YOU FASCIST IN A HATCHBACK!"
2. "YEAH, RUN ME DOWN! THAT'S WHAT THE MAN WANTS!"
3. "OI! I'M SPITTING ON YOUR WINDSHIELD, YOU PRAT!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY MOPED! IT'S HELD TOGETHER WITH SAFETY PINS, NUMPTY!"
2. "YOU HIT MY MAILBOX? GOOD. I HATE MAIL. STILL, OI!"
3. "YOU DENTED MY CAR! IT'S A WRECK, BUT IT'S MY WRECK!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "ONE BEAN BURRITO. NO, I WON'T SMILE."
2. "GOT A GIG IN THE GARAGE TONIGHT. HURRY UP."
3. "SOFT TACO. AND I'M NOT TIPPING THE MAN."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "THE MAN IS KEEPING ME FROM MY TACO!"
2. "*INCOHERENT SCREAMING*"
3. "OI! I'VE GROWN A WHOLE NEW MOHAWK BACK HERE!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "QUEUES ARE FOR SHEEP. BAAA! BAAA!"
2. "THIS LINE IS CONFORMITY. I'M STANDING IN IT ANGRILY."
3. "ALL THESE SQUARES IN FRONT OF ME. KILL ME NOW."

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU ABSOLUTE MUPPET! A RIGHT BERK, YOU ARE!"
2. "WRONG, YOU CABBAGE-BRAINED NITWIT!"
3. "THAT'S NOT MINE! ARE YOU WORKING FOR THE MAN?!"

#### Served

Kitchen Shift: a ticket was served.

1. "FINE. IT'S GOOD. DON'T TELL ANYONE."
2. "THIS TACO IS ANTI-ESTABLISHMENT. I DIG IT."
3. "ALRIGHT. IT'S NOT CRAP. CHEERS."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FAST AND PERFECT! YOU'RE A REBEL, MATE! A REBEL!"
2. "THAT'S THE MOST PUNK THING I'VE SEEN ALL WEEK!"
3. "OKAY. FLAWLESS. I'M SPITTING ON THE FLOOR IN RESPECT."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "UP YOURS, BUTT MUNCH!"
2. "I HAVE DRUNK FROM ROYALTY. I WILL NOT BE IGNORED."
3. "I HATE YOU AND I HATE THIS PLACE AND I HATE EVERYTHING!"

### c80skibum



#### Delivered

Delivery Shift: the order arrived in good time.

1. "OH, BEAUTY! WARM TACOS! YOU'RE A LEGEND!"
2. "SHREDDED THAT DELIVERY, DUDE. PURE FLOW."
3. "WARM AND ON TIME. THAT'S A BLUEBIRD DAY, MAN."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "STUCK THE LANDING, DUDE! FULL MARKS FROM THE JUDGES!"
2. "RIGHT ON THE MAT! THAT'S A GOLD MEDAL HUCK!"
3. "OH, BEAUTY! YOU THREADED THAT LIKE A TREE RUN!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "OH, BEAUTY. COLD TACOS. JUST BEAUTY, YOU GUYS."
2. "MAN, MY TACOS GOT FROSTBITE BEFORE YOU GOT HERE."
3. "SLUSH. YOU BROUGHT ME SPRING SLUSH, DUDE."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "THE BAG'S IN THE SNOWBANK! TOTAL YARD SALE, DUDE!"
2. "YOU TOMAHAWKED MY DINNER INTO THE HEDGE!"
3. "MY BURRITO'S IN THE TREE WELL, YOU GAPER!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! WATCH IT, GAPER! I'M NOT A SLALOM GATE!"
2. "YOU ALMOST WIPED ME OUT LIKE A DAMN AVALANCHE!"
3. "DUDE! SKI PATROL WOULD YANK YOUR PASS FOR THAT!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY VAN! MY SKI RACK! YOU DOWNHILL DIPSTICK!"
2. "THAT'S MY WHOLE HOUSE, MAN! I LIVE IN THAT VAN!"
3. "YOU DENTED MY SUBARU, YOU FLATLAND JACKASS!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "JUST GOT BACK FROM THE MOUNTAINS. STARVING!"
2. "I'M DRIVING TO COLORADO TONIGHT. TACOS!"
3. "GOTTA BEAT THE STORM TO I-70. CHILI BURRITO!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I'VE SEEN GLACIERS SHRED FASTER THAN THIS!"
2. "JUST FLOW WITH IT, DUDE - BUT FLOW FASTER!"
3. "ARE YOU LIVING YOUR DREAM, TACO MAKER?! ARE YOU?!"
4. "OK FINE, FORGET THE LETTUCE. JUST GIVE IT TO ME."

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS IS WORSE THAN THE LIFT LINE ON A HOLIDAY!"
2. "DUDE, IT'S A POWDER DAY SOMEWHERE AND I'M IN LINE!"
3. "EVERYBODY JUST FLOW, MAN... OKAY, NOBODY'S FLOWING."

#### Wrong

Kitchen Shift: a wrong pick.

1. "DUDE, THAT'S NOT ON THE TICKET! YOU CAUGHT AN EDGE!"
2. "WRONG LINE, DUDE! YOU'RE IN THE TREES NOW!"
3. "OH, BEAUTY. NO. NOT BEAUTY. PUT THAT BACK."

#### Served

Kitchen Shift: a ticket was served.

1. "THAT'S A POWDER-DAY TACO, MAN."
2. "TOTALLY LIVING THE DREAM NOW, TACO MAKER."
3. "THAT'S FRESH CORDUROY IN A TORTILLA, MAN."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FIRST CHAIR, FRESH POW, PERFECT TACO. I'M CRYING."
2. "YOU'RE LIVING THE DREAM, TACO MAKER! I'M SO PROUD!"
3. "OH, BEAUTY! THAT TICKET WAS A FACE SHOT, MAN!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M OUT, MAN. THE MOUNTAINS DON'T MAKE ME WAIT."
2. "THIS PLACE IS ALL ICE AND NO POWDER, DUDE!"
3. "LATER, FLATLANDERS! I'LL EAT SNOW IN COLORADO!"

### c80valleyguy



#### Delivered

Delivery Shift: the order arrived in good time.

1. "WHOA, RIGHT ON THE MAT. THAT'S RAD."
2. "NOT BOGUS AT ALL. LIKE, THE OPPOSITE."
3. "LIKE, HOT TACOS? AT MY HOUSE? TOTALLY TUBULAR."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER ON THE MAT?! I'M, LIKE, SPIRITUALLY MOVED."
2. "WHOA. THAT WAS LIKE, A TACO FROM THE GODS, MAN."
3. "NO WAY! THAT TOSS WAS SO RAD I FORGOT TO BE HUNGRY."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "THIS IS BOGUS TO THE MAX!"
2. "MAN, THESE NACHOS ARE COLDER THAN MY STEPMOM."
3. "COLD TACOS? THAT'S NOT RAD. THAT'S, LIKE, ANTI-RAD."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "GET A LIFE, TACO FUMBLER!"
2. "DUDE, MY DINNER IS IN THE BUSHES. HEAVY BUMMER."
3. "YOU THREW IT ON THE ROOF?! WHO RAISED YOU, MAN?"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! I CAME OUT HERE IN PEACE, YOU MANIAC!"
2. "DUDE! YOU ALMOST MADE ME A SPEED BUMP!"
3. "GRODY! YOU NEARLY RAN OVER MY WHOLE FUTURE!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY MOM'S CAR! SHE'S GONNA, LIKE, END ME, MAN!"
2. "YOU DINGED MY CAMARO, YOU TOTAL BARF BAG!"
3. "THAT'S A BUMPER, DUDE, NOT A SUGGESTION!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "HEY, NACHOS? BUT LIKE, FAST NACHOS?"
2. "I SKIPPED SECOND PERIOD FOR THIS, MAN."
3. "SNEAKING OUT OF FIFTH PERIOD. BEAN BURRITO, QUICK."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "NOT RAGEFUL, JUST CONCERNED... AND ALSO RAGEFUL!"
2. "I'M LIKE, TOTALLY ZEN, MAN. EXCEPT I WANT TO SCREAM."
3. "BIG GUACAMOLE IS SLOWING MY ORDER ON PURPOSE, MAN!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS SO LONG I'M GONNA GRADUATE IN IT."
2. "DUDE, MY VICE PRINCIPAL IS BACK THERE. HIDE ME."
3. "EVERYBODY CHILL! LIKE, NOBODY'S CHILLING! WHY?!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "BIG GUACAMOLE HAS ITS CLAWS IN THIS PLACE!"
2. "WHOA! WHO TOLD YOU TO PUT THAT ON? WAS IT THEM?"
3. "THAT'S NOT MY ORDER. THAT'S, LIKE, A COVER-UP."

#### Served

Kitchen Shift: a ticket was served.

1. "THIS IS LIKE, PEACE IN TACO FORM."
2. "I CAME IN PEACE. I LEAVE IN FULLNESS."
3. "LIKE, I FEEL WHOLE NOW, MAN. THANKS."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "THAT WAS SO FAST IT'S, LIKE, A GOVERNMENT SECRET."
2. "DUDE. PERFECT. I'M GONNA TELL MY GUIDANCE COUNSELOR."
3. "TUBULAR! I'M, LIKE, NOT EVEN MAD AT ANYBODY RIGHT NOW."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I CAME HERE IN PEACE. I LEAVE IN PIECES OF DISAPPOINTMENT."
2. "BOGUS. I'M GOING BACK TO SCHOOL. THAT'S HOW BAD THIS IS."
3. "I CAME IN PEACE. I LEAVE IN, LIKE, A HUFF, MAN."

### c80arcadekid2



#### Delivered

Delivery Shift: the order arrived in good time.

1. "CAPTAIN, THE PACKAGE HAS ARRIVED! WARM!"
2. "BULLSEYE! TEN THOUSAND POINTS!"
3. "PACKAGE SECURED! EXTRA LIFE GRANTED!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "PERFECT LANDING! HIGH SCORE! ENTER YOUR INITIALS!"
2. "WHOA! BONUS STAGE! YOU HIT THE MAT DEAD CENTER!"
3. "CAPTAIN! A FLAWLESS DOCKING MANEUVER!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "MY TACOS FROZE! ZERO-POINT BONUS FOR YOU!"
2. "CAPTAIN'S LOG: THE TACO IS COLD. CREW MORALE: LOW."
3. "YOU'RE SLOWER THAN MY GRANDMA PLAYING PAC-MAN!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "EAT IT, GRAVY DRAWERS!"
2. "YOU MISSED! THE HEDGE MONSTER ATE MY DINNER!"
3. "NICE AIM, DORKUS! IT'S ON THE ROOF NOW!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HEY! I ONLY HAVE ONE LIFE LEFT, BUTTHEAD!"
2. "RED ALERT! RED ALERT! SOME DINGUS TRIED TO RUN ME OVER!"
3. "YOU ALMOST SQUISHED ME LIKE A FROGGER FROG!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY BIKE! YOU RAN OVER MY BIKE, YOU MEGA-DWEEB!"
2. "THAT'S MY DAD'S CAR! I'M TELLING! I'M TELLING SO HARD!"
3. "YOU CRASHED! TAKE DAMAGE! MINUS A MILLION POINTS!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "ONE HARD TACO! I'M ON MY LAST LIFE!"
2. "MY BIKE'S OUT FRONT. NO LOCK. HURRY!"
3. "MOM GAVE ME FIVE BUCKS! NACHOS! GO GO GO!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "MINE TACO! WHERE IS MINE TACO?!"
2. "CAPTAIN, SENSORS DETECT ZERO PROGRESS ON MY TACO!"
3. "BIG MONEY! BIG MONEY! NO WHAMMIES! ...JUST A SLOW TACO."

#### Queue

Kitchen Shift: the line is past three customers.

1. "BY MY SWORD, I SHALL LAY SIEGE TO THIS KITCHEN!"
2. "THIS LINE IS LONGER THAN THE ONE FOR DRAGON'S LAIR!"
3. "CAPTAIN, WE'RE STUCK IN AN ASTEROID FIELD OF PEOPLE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "WRONG BUTTON! WRONG BUTTON! YOU'RE JUST MASHING!"
2. "BY MY SWORD, THAT IS NOT MY TOPPING, VILLAIN!"
3. "EWW! THAT'S GROSS! I'M NOT EATING THAT, DORK!"

#### Served

Kitchen Shift: a ticket was served.

1. "BY MY SWORD, THIS IS A GOOD TACO!"
2. "SENSORS DETECT MAXIMUM TACO. HOORAY!"
3. "LEVEL COMPLETE! THANK YOU, TACO WIZARD!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "NO DEATHS! NO MISSES! YOU'RE A TACO GRANDMASTER!"
2. "CAPTAIN, THE TACO WAS DELIVERED AT WARP SPEED!"
3. "FLAWLESS! YOUR NAME GOES ON THE HIGH SCORE BOARD!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I HOPE YOU STEP ON A LEGO EVERY DAY FOR A YEAR!"
2. "I'M TELLING MY MOM AND SHE'S GONNA TELL YOUR MOM!"
3. "YOU STINK! YOU STINK LIKE THE BOYS' LOCKER ROOM!"

### c80newsanchor



#### Delivered

Delivery Shift: the order arrived in good time.

1. "THIS JUST IN: DINNER ARRIVED ON TIME."
2. "IN LOCAL NEWS, A DRIVER DOES IT RIGHT."
3. "GOOD EVENING. MY DINNER IS HERE, AND IT'S HOT."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "BREAKING NEWS: A TOSS OF HISTORIC ACCURACY!"
2. "WE INTERRUPT THIS PROGRAM FOR A PERFECT TOSS!"
3. "SOURCES CONFIRM: DEAD CENTER. I'M SPEECHLESS. ON AIR."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "MY VIEWERS DESERVE TO KNOW!"
2. "AS A FOOD JOURNALIST... SORT OF... I'M DEEPLY DISAPPOINTED."
3. "BEAR MARKET ON TACOS TODAY, APPARENTLY!"
4. "WHAT A COLOSSAL COLLAPSE FROM THIS TACO SHOP!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "LIVE FROM MY HEDGE: A TRAGEDY UNFOLDS."
2. "CORRECTION: MY DINNER IS NOW ON THE ROOF."
3. "TONIGHT'S TOP STORY: SOME JACKASS AND MY HEDGE."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "THIS REPORTER WAS NEARLY STRUCK BY A TACO MANIAC!"
2. "WATCH IT! THIS FACE IS INSURED, JACKASS!"
3. "YOU NEARLY MADE ME THE LEAD STORY, YOU LUNATIC!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CAR! I'M OPENING TONIGHT WITH YOUR LICENSE PLATE!"
2. "THAT'S A STATION CAR, YOU BUFFOON! MY FACE IS ON IT!"
3. "HIT AND RUN! THE SUSPECT DRIVES A TACO CAR!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I GO ON AT SIX. I NEED NACHOS AT FIVE."
2. "SOFT TACO, PLEASE. MY MAKEUP IS SETTING."
3. "I'M ON IN TWENTY. CHILI ENCHILADA, NO SPLATTER."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "WE ARE NOW COMING TO YOU LIVE FROM THE WAIT."
2. "DEVELOPING STORY: I'M ABOUT TO LOSE IT ON CAMERA."
3. "MY PRODUCER IS SCREAMING IN MY EARPIECE! HURRY!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I HAVE BEEN STANDING HERE SINCE THE LAST PRESIDENT!"
2. "CROWDS GATHER. TEMPERS FLARE. TACOS? STILL NONE."
3. "THIS LINE HAS MORE PEOPLE THAN MY RATINGS!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "STOP THE PRESSES! THAT IS NOT WHAT I ORDERED!"
2. "WE'LL HAVE TO ISSUE A RETRACTION ON THAT TOPPING."
3. "THAT GOES IN MY EXPOSE, YOU TACO HACK!"

#### Served

Kitchen Shift: a ticket was served.

1. "AND THAT'S THE TACO OF THE DAY. BACK TO YOU."
2. "I GIVE THIS SANCHO A GLOWING REPORT."
3. "THAT'S OUR REPORT. THE TACO WAS EXCELLENT."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "AN EMMY! SOMEBODY GET THIS COOK A LOCAL EMMY!"
2. "TOP OF THE HOUR: A FLAWLESS TICKET. I'M MOVED."
3. "AND IN A STORY THAT WARMS THE HEART: A PERFECT ORDER."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "THIS IS GOING IN THE PAPER! AND ON THE LOCAL NEWS!"
2. "I'M LEAVING. TONIGHT, YOU'RE THE CONSUMER ALERT."
3. "THAT'S ALL THE TIME WE HAVE. AND I'M OUT OF IT."

### c80miamigirl



#### Delivered

Delivery Shift: the order arrived in good time.

1. "WELL, BLESS YOUR SWEET LITTLE WHEELS!"
2. "HOT AND ON TIME? HONEY, YOU'RE A DOLL."
3. "HOT TACOS AT MY DOOR? SUGAR, YOU'RE A DREAM."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "RIGHT ON THE MAT! HONEY, I COULD JUST MARRY YOU."
2. "DEAD CENTER! SUGAR, YOU'VE GOT HANDS LIKE A SURGEON."
3. "WELL, LOOK AT THAT! PRETTIER THAN MY HEADSHOT!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD TACOS? HONEY, I'LL TAKE THAT TIP BACK IN CASH."
2. "MY NAILS DRIED, MY PINOT'S GONE, AND THESE ARE COLD!"
3. "BLESS YOUR HEART, DID YOU DRIVE HERE BACKWARD?"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "MY TACOS ARE IN THE AZALEAS, YOU ROTTEN LITTLE TOAD!"
2. "HONEY, THE PORCH IS THE BIG FLAT THING. LOOK AT IT."
3. "I JUST DID THESE NAILS AND NOW I DIG IN A HEDGE?!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT, YOU GREASY LITTLE WEASEL! I'M IN HEELS!"
2. "YOU ALMOST FLATTENED A FACE THAT PAYS RENT, SUGAR!"
3. "I'LL SMACK THAT GRIN RIGHT OFF YOUR BUMPER, HON!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CONVERTIBLE! YOU JUST KISSED MY CONVERTIBLE!"
2. "BLESS YOUR HEART, YOU'RE ABOUT TO GET SUED, SUGAR."
3. "THAT CAR WAS A DIVORCE PRESENT, YOU NUMBSKULL!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "PHOTO SHOOT IN AN HOUR. SOFT TACO, HON."
2. "I'M HALF DONE WITH MY NAILS. MAKE IT QUICK."
3. "BEAN BURRITO, SUGAR. I'VE GOT A TAN TO MAINTAIN."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "YOU'VE BURIED MY PATIENCE AT THE BOTTOM OF THE SEA!"
2. "I HAVE A PHOTO SHOOT IN AN HOUR AND YOU'RE KILLING ME!"
3. "I HAVE HALF A GLASS OF PINOT AND A WHOLE LOT OF RAGE!"
4. "I CAN NOT GET THE DRY CLEANING! I'M A HOSTAGE OF SLOW TACO PEOPLE!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "HONEY, MY HAIRSPRAY WILL GIVE OUT BEFORE THIS LINE DOES."
2. "THIS LINE'S LONGER THAN MY LIST OF EX-HUSBANDS!"
3. "SUGAR, I DID NOT GET DRESSED UP TO STAND IN A LINE."

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU HALF-COOKED BURRITO OF A MAN!"
2. "BLESS YOUR SWEET LITTLE IGNORANT HEART!"
3. "SUGAR, IF THAT TOUCHES MY TACO, YOU TOUCH THE FLOOR."

#### Served

Kitchen Shift: a ticket was served.

1. "NOW THIS IS A TACO WORTH POSING WITH."
2. "YOU JUST SAVED MY WHOLE AFTERNOON, SUGAR."
3. "THAT'S PRETTY ENOUGH FOR A MAGAZINE, HON."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "SUGAR, THAT WAS QUICKER THAN MY SECOND MARRIAGE!"
2. "HONEY, I COULD KISS YOU. I WON'T. LIPSTICK'S FRESH."
3. "PERFECT! YOU JUST EARNED YOURSELF A SIGNED HEADSHOT!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M GOING. AND I'M TAKING MY GOOD LOOKS WITH ME!"
2. "BLESS YOUR HEART. NOW GO TO HELL, SUGAR."
3. "HONEY, I'VE WALKED OUT ON BETTER MEN THAN YOU."

### c80jock2



#### Delivered

Delivery Shift: the order arrived in good time.

1. "THAT'S HOW YOU THROW A SPIRAL, BUDDY!"
2. "RIGHT ON THE NUMBERS! I LOVE IT!"
3. "HOT FOOD, RIGHT ON TIME! THAT'S A FIRST DOWN!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "RIGHT BETWEEN THE UPRIGHTS, BUDDY! IT'S GOOD!"
2. "DEAD CENTER! YOU'RE STARTING QUARTERBACK NOW!"
3. "WHOA! PUT THAT ARM ON THE VARSITY SQUAD!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD?! THAT'S A FIFTEEN-YARD PENALTY, BUDDY!"
2. "MY GRANDMA RUNS A FASTER FORTY THAN YOU DRIVE!"
3. "YOU FUMBLED DINNER, YOU SLOW-FOOTED NERD!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "INCOMPLETE! YOU THROW LIKE A WET NOODLE, MELVIN!"
2. "IT'S IN THE BUSHES! I'M GONNA GIVE YOU A SWIRLY!"
3. "THAT'S AN INTERCEPTION BY MY HEDGE, YOU DWEEB!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! YOU WANNA GET TACKLED, BUDDY?! DO YA?!"
2. "ROUGHING THE PEDESTRIAN! FLAG ON THE PLAY!"
3. "I'LL TACKLE THAT CAR, BUDDY! I'LL TACKLE IT HARD!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "THAT'S CLIPPING! THAT'S A PERSONAL FOUL, BUDDY!"
2. "YOU DENTED MY TRANS AM! I'LL FIGHT YOUR WHOLE DAD!"
3. "GET OUT OF THE CAR! I'M GONNA SACK YOU, MELVIN!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I'M LATE FOR THE TAILGATE, BUDDY!"
2. "SIX CHILI BURRITOS FOR THE TAILGATE!"
3. "COACH SAYS EAT BIG. SO I'M EATING BIG!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I'LL FIGHT YOUR DAD! I'LL FIGHT YOUR DAD! I'LL FIGHT ANY DAD!"
2. "ICE THE KICKER! ICE THE DANG TACO MAKER!"
3. "GET THE LEAD OUT, MAGGOT!"
4. "I COULD DEADLIFT THIS WHOLE BUILDING IN LESS TIME!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "COME ON! RUN THE HURRY-UP OFFENSE BACK THERE!"
2. "THIS LINE IS SLOWER THAN A THIRD-STRING LINEMAN!"
3. "I'M STARVING! I DID TWO-A-DAYS, BUDDY!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "WRONG PLAY! THAT AIN'T IN MY PLAYBOOK, MELVIN!"
2. "FALSE START! PUT IT BACK AND RUN IT AGAIN!"
3. "YOU CALL THAT A TACO? I CALL THAT A SAFETY!"

#### Served

Kitchen Shift: a ticket was served.

1. "WHOO! I COULD BENCH THIS TACO TWICE!"
2. "THAT'S GAME DAY FOOD, MY FRIEND!"
3. "BIG TACO FOR A BIG BOY! LET'S GO!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "MVP! MVP! THIS COOK IS THE MVP!"
2. "THAT WAS A TWO-MINUTE DRILL, BUDDY! FLAWLESS!"
3. "I'D PUT YOU ON MY SHOULDERS IF THE CEILING WAS HIGHER!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "TAKE A LONG WALK OFF A SHORT PIER, YOU ABSOLUTE MELVIN!"
2. "I'M GOING TO THE KEGGER HUNGRY! THANKS, MELVIN!"
3. "YOU JUST GOT BENCHED, BUDDY! FOR LIFE!"

### c80preppygirl



#### Delivered

Delivery Shift: the order arrived in good time.

1. "THANK YOU KINDLY. MANNERS AND SPEED!"
2. "OH, HOW THOUGHTFUL. I'LL TELL THE PASTOR."
3. "RIGHT ON TIME. MOTHER WILL BE SO PLEASED."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "ON THE MAT! THAT'S A BLUE-RIBBON TOSS, TRULY."
2. "WELL! THAT WAS POSITIVELY NEIGHBORLY OF YOU."
3. "DEAD CENTER! I'LL PUT YOU ON MY PRAYER LIST."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "WHERE I COME FROM, WE SERVE TACOS WITH MANNERS!"
2. "COLD? THAT'S JUST TACKY. SIMPLY TACKY."
3. "IT'S A GOOD THING I'M A FORGIVING PERSON. I'M NOT."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "YOU THREW SUPPER IN THE ROSEBUSH, YOU HEATHEN!"
2. "IT'S ON THE ROOF?! WHAT WOULD MY PASTOR SAY?!"
3. "I HOPE YOU'RE PROUD OF YOURSELF, YOU DIMWIT."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HEAVENS! YOU NEARLY SENT ME TO MEET MY MAKER!"
2. "I'M WEARING MY GOOD PEARLS, YOU MANIAC!"
3. "THE LORD SAW THAT, AND SO DID DADDY'S LAWYER!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY VOLVO! DADDY GAVE ME THAT VOLVO, YOU BRUTE!"
2. "YOU JUST DENTED A GRADUATION PRESENT, YOU OAF!"
3. "I'M PRAYING FOR YOU. I'M PRAYING YOU GET CAUGHT."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "ONE SOFT TACO. I'M LATE FOR CHOIR."
2. "FELLOWSHIP SUPPER'S AT SIX. I NEED NACHOS."
3. "ONE BEAN BURRITO, PLEASE. BIBLE STUDY AT SEVEN."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "THE CHURCH IS FILLED WITH MY GUESTS!"
2. "I AM BEING VERY PATIENT. LIKE JOB. BUT LESS."
3. "THE YOUTH GROUP IS WAITING ON ME, YOU KNOW."

#### Queue

Kitchen Shift: the line is past three customers.

1. "SOMEONE OUGHT TO FORM A COMMITTEE ABOUT THIS LINE."
2. "THIS LINE IS LONGER THAN THE PASTOR'S SERMONS!"
3. "EXCUSE ME, SIR, I BELIEVE I WAS HERE FIRST. REALLY."

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU GUACAMOLE-BRAINED NINCOMPOOP!"
2. "THIS KITCHEN NEEDS A MANAGEMENT CONSULTANT. IMMEDIATELY."
3. "THAT'S NOT WHAT I ASKED FOR, YOU MUTTONHEAD."

#### Served

Kitchen Shift: a ticket was served.

1. "THAT IS JUST LOVELY. SIMPLY LOVELY."
2. "WAIT TILL I TELL MY BIG SISTER. SHE'LL DIE."
3. "MOTHER WOULD APPROVE. AND SHE APPROVES OF NOTHING."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT! I'M PUTTING YOU IN THE CHURCH NEWSLETTER!"
2. "OH MY STARS! FASTER THAN THE POTLUCK CASSEROLE LINE!"
3. "MY BIG SISTER IS GOING TO BE SO JEALOUS. SO JEALOUS."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M TELLING THE PASTOR!"
2. "I'M GOING TO MY BIG SISTER ABOUT THIS!"
3. "I'LL BE PRAYING FOR THIS KITCHEN. LOUDLY. IN PUBLIC."

### c80gamer



#### Delivered

Delivery Shift: the order arrived in good time.

1. "A CRITICAL HIT! RIGHT ON THE DOORMAT!"
2. "THE SCROLL OF DINNER HAS ARRIVED. HUZZAH!"
3. "THE QUEST IS COMPLETE. THE NACHOS ARE WARM."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "A NATURAL TWENTY! THE BARDS SHALL SING OF THIS!"
2. "DEAD CENTER! YOUR DEXTERITY MUST BE EIGHTEEN!"
3. "OH GEEZ! A PERFECT TOSS! I THINK I'M GONNA CRY!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "MY TACOS FAILED THEIR SAVING THROW AGAINST COLD."
2. "THE PARTY STARVED. THE CAMPAIGN IS RUINED. THANKS."
3. "YOU MOVE AT THE SPEED OF A GELATINOUS CUBE!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "YOU COMPLETE AND TOTAL FLARGUS!"
2. "YOU FUMBLED! THE HEDGE GOBLINS HAVE MY DINNER!"
3. "ON THE ROOF?! YOU HAVE THE AIM OF A DRUNK KOBOLD!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "I HAVE ONE HIT POINT LEFT, YOU MANIAC!"
2. "SHIELDS UP! SHIELDS UP! YOU NEARLY HIT ME, FLARGUS!"
3. "OH JEEZ, OH GEEZ, YOU ALMOST KILLED ME, BUDDY!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY MOM'S PINTO! I'LL BE GROUNDED TILL LEVEL TEN!"
2. "YOU HIT MY CAR! I CURSE YOUR BLOODLINE, CHAOTIC EVIL!"
3. "THAT DENT IS COMING OUT OF YOUR GOLD PIECES, BUDDY!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "OUR CAMPAIGN STARTS AT SEVEN. NACHOS!"
2. "THE PARTY SENT ME FOR SUPPLIES. FOUR TACOS."
3. "THE DUNGEON MASTER DEMANDS SANCHOS. SIX OF THEM."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "JUST YOU WAIT, TACO BOY. JUST. YOU. WAIT."
2. "MY CHARACTER WOULD'VE STARVED TO DEATH BY NOW."
3. "I ROLL INITIATIVE... AGAINST THIS WHOLE KITCHEN."

#### Queue

Kitchen Shift: the line is past three customers.

1. "OH GEEZ, OH JEEZ, THIS IS UNCOMFORTABLE, HUH?"
2. "THIS LINE IS LIKE A DUNGEON WITH NO EXIT, HUH?"
3. "OH GEEZ. THIS IS MORE PEOPLE THAN MY BIRTHDAY PARTY."

#### Wrong

Kitchen Shift: a wrong pick.

1. "I CAST MAGIC MISSILE ON THE TACO COOK!"
2. "THAT ITEM IS CURSED! PUT IT BACK, FOOL!"
3. "OH JEEZ, NO, NO. YOU FAILED A WISDOM CHECK, BUDDY."

#### Served

Kitchen Shift: a ticket was served.

1. "I AWARD THIS COOK FIFTY EXPERIENCE POINTS."
2. "OH GEEZ, THIS IS GOOD. LIKE, REALLY GOOD."
3. "LOOT ACQUIRED. THANK YOU, NOBLE COOK."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "LEVEL UP! YOU JUST HIT LEVEL UP, TACO WIZARD!"
2. "ALL RIGHT! A FLAWLESS RUN! NOT ONE WANDERING MONSTER!"
3. "I'M PROMOTING YOU TO PALADIN OF THE TORTILLA!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "BEAM ME UP, SCOTTY - I'M LEAVING!"
2. "I'M TELEPORTING OUT. LIKE, BY WALKING. BUT STILL."
3. "MAY YOUR DICE ROLL ONES FOREVER, YOU FLARGUS!"

### c80metalhead2



#### Delivered

Delivery Shift: the order arrived in good time.

1. "STILL WARM! I'LL GO TO CHURCH THIS SUNDAY!"
2. "YOU'RE ALL RIGHT, DRIVER. YOU'RE ALL RIGHT."
3. "STILL WARM. LIKE MY BUNS AFTER A DRUM SOLO."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! THAT GAVE ME A LITTLE TINGLE, MAN!"
2. "ON THE MAT! I GOT GOOSEBUMPS IN WEIRD PLACES!"
3. "THAT TOSS HIT HARDER THAN MY FIRST BACKSTAGE PASS."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD AND LIMP. LIKE UNCLE RAY. AT THE WAKE."
2. "MY TACOS ARE COLDER THAN MY BACK SWEAT, MAN!"
3. "I WAITED SO LONG MY PERM WENT FLAT. NOT JUST UP TOP."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "MY BURRITO'S IN THE BUSHES! THAT'S WHERE I PEE!"
2. "ON THE ROOF?! THAT'S WHERE I HIDE MY MAGAZINES, MAN!"
3. "IT'S IN THE HEDGE! I'M EATING IT ANYWAY, YOU PISSER!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! YOU ALMOST MADE ME CRAP MY SPANDEX, MAN!"
2. "WATCH IT! I GOT A DELICATE PROSTATE, YOU JACKASS!"
3. "SLOW DOWN! I'M CARRYING A FULL BLADDER AND A DREAM!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY VAN! THAT VAN HAS SEEN THINGS, MAN! BEAUTIFUL THINGS!"
2. "YOU DENTED MY CAMARO, YOU SON OF A-"
3. "THAT'S MY SHAG-CARPET VAN, YOU SKID MARK!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "MY UNCLE'S FUNERAL STARTS IN TEN MINUTES! HE LOVED TACOS!"
2. "LUNCH BREAK FROM THE BODY SHOP. HURRY!"
3. "CHILI SANCHO. I GOT A GARAGE GIG TONIGHT."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I'LL GO TO CHURCH EVERY SUNDAY IF MY TACO ARRIVES BY THREE!"
2. "I'M SWEATING THROUGH MY LEATHER. IN THE CRACK, MAN."
3. "MY GUT'S MAKING NOISES LIKE A DOUBLE KICK DRUM!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I STARTED THIS ORDER WITH A FULL HEAD OF HAIR!"
2. "THIS LINE'S SO TIGHT I'M GETTING TO KNOW THE GUY BEHIND ME."
3. "I'VE STOOD SO LONG MY TIGHT JEANS FUSED TO ME."

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU'RE A REAL PISSER, YOU KNOW THAT?"
2. "NOT THAT! THAT GIVES ME THE THUNDER DOWN BELOW!"
3. "WRONG! AND I'M ALLERGIC! I SWELL UP! EVERYWHERE!"

#### Served

Kitchen Shift: a ticket was served.

1. "UNCLE RAY WOULD'VE LOVED THIS TACO."
2. "MY HAIR GREW BACK JUST LOOKING AT THIS."
3. "BEAUTIFUL. I'M GONNA EAT THIS IN THE BATHTUB."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "OH YEAH! THAT WAS FASTER THAN MY FIRST TIME, MAN!"
2. "FLAWLESS! I GOTTA GO LIE DOWN AND THINK ABOUT THIS!"
3. "METAL! I'D GET YOUR NAME TATTOOED ON MY LEFT CHEEK!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'LL DEMO THIS PLACE WITH A SLEDGEHAMMER, SEE IF I WON'T!"
2. "I'M OUT! I LEFT A LITTLE SOMETHING IN YOUR BATHROOM!"
3. "SCREW YOU! I'LL EAT GAS STATION HOT DOGS TILL I DIE!"

### c80businessguy



#### Delivered

Delivery Shift: the order arrived in good time.

1. "THAT'S HOW YOU RUN A BUSINESS. ON TIME."
2. "YOU'RE GOING PLACES, KID. KEEP HUSTLING."
3. "ON TIME, ON BUDGET. I LIKE YOUR NUMBERS, KID."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! THAT'S A BLUE-CHIP TOSS, KID!"
2. "NOW THAT'S EXECUTION. I'D GIVE YOU A RAISE IF I COULD."
3. "BULLSEYE! YOU JUST CLOSED THE DEAL, PAL!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD TACOS? THAT'S A LOSING QUARTER, PAL."
2. "LATE AND COLD. YOU'D BE FIRED BY LUNCH AT MY FIRM."
3. "I'VE SEEN MERGERS CLOSE FASTER THAN YOUR DELIVERY!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE BUSHES? YOU JUST WROTE OFF MY DINNER, PAL!"
2. "THAT'S A TOTAL LOSS! I'M DEDUCTING IT FROM YOUR TIP!"
3. "MY DINNER'S ON THE ROOF, YOU MIDDLE-MANAGEMENT MORON!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT, PAL! THIS SUIT COST MORE THAN YOUR CAR!"
2. "YOU NEARLY HIT A VICE PRESIDENT, YOU JACKASS!"
3. "I'LL HAVE YOUR LICENSE AND YOUR BOSS'S LICENSE!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CADILLAC! MY LAWYERS EAT GUYS LIKE YOU FOR BREAKFAST!"
2. "YOU DENTED A COMPANY CAR! THAT'S A LAWSUIT, KID!"
3. "I'M GONNA OWN THAT TACO CAR BY FRIDAY, PAL!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I GOT PEOPLE WAITING. TWO SANCHOS."
2. "I'M ON THE CLOCK, PAL. CHILI BURRITO."
3. "MAKE IT SNAPPY, KID. SANCHEZ. I'M BILLING HOURS."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I'M GONNA DOWNSIZE THIS TACO SHOP!"
2. "I GOT PEOPLE WAITING ON ME, YOU UNDERSTAND?"
3. "THIS DELAY IS COSTING ME A FORTUNE, KID!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "WE DIDN'T HAVE 'FOOD COURTS' - WE HAD DIGNITY!"
2. "THIS IS WORSE THAN THE TIME I HAD TO WAIT AT THE DMV IN '83!"
3. "I SEE A BOTTLENECK. I SEE A BOTTLENECK RIGHT HERE."

#### Wrong

Kitchen Shift: a wrong pick.

1. "THAT'S NOT IN THE CONTRACT, PAL. PUT IT BACK."
2. "WHO HIRED YOU? I WANT TO FIRE THEM TOO."
3. "WRONG! THAT'S THE KIND OF MISTAKE THAT TANKS A STOCK!"

#### Served

Kitchen Shift: a ticket was served.

1. "NOW THAT'S DIGNITY IN A TORTILLA."
2. "I'D PUT THIS COOK IN THE CORNER OFFICE."
3. "SOLID WORK. I'LL MENTION YOU AT THE BOARD MEETING."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS! KID, YOU'RE MANAGEMENT MATERIAL!"
2. "THAT WAS A HOSTILE TAKEOVER OF MY HUNGER! BEAUTIFUL!"
3. "PERFECT TICKET! I'M BUYING STOCK IN THIS JOINT!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'LL HAVE YOUR JOB BY THE END OF THE DAY!"
2. "I'M TAKING MY CAPITAL ELSEWHERE!"
3. "SUCCESSFUL PEOPLE DON'T WAIT FOR TACOS! THEY MAKE THEIR OWN!"

### c80valleyguy2



#### Delivered

Delivery Shift: the order arrived in good time.

1. "BRO! THAT'S LIKE, THE MOST STOKED I'VE BEEN!"
2. "FORSOOTH, THE BAG HAS LANDED, BRO!"
3. "HOT TACOS, BRO! YOU'RE LIKE MY BEST FRIEND NOW!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "BRO! RIGHT ON THE MAT! I'M SO STOKED I COULD CRY!"
2. "FORSOOTH! A TOSS MOST BODACIOUS, BRO!"
3. "THAT WAS A NATURAL TWENTY ON THE DOORMAT, BRO!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "YOU ABSOLUTE SHMORGASBORD OF DISAPPOINTMENT!"
2. "BRO, MY NACHOS ARE COLD. THAT'S A NOT-STOKED SITUATION."
3. "YOU ABSOLUTE BUFFET OF LETDOWNS, BRO!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "BRO... BRO... THAT'S LIKE, THE OPPOSITE OF STOKED, BRO."
2. "FORSOOTH! THE BAG IS IN THE SHRUBBERY, BRO!"
3. "BRO, YOU JUST WIPED OUT ON MY WHOLE LAWN."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA, BRO! YOU ALMOST GAVE ME A NEAR-DEATH EXPERIENCE!"
2. "LOOK, KIDS! IT'S A MANIAC! WAVE BYE TO YOUR LIFE!"
3. "BRO! NOT COOL, BRO! TOTALLY NOT COOL!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "BRO! THAT WAS MY DAD'S BEEMER, BRO! I'M DEAD!"
2. "FORSOOTH, KNAVE! THOU HAST DINGED MY RIDE!"
3. "BRO, YOU TOTALLY BOGUSED MY BUMPER, YOU DINGLEBERRY!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "SUP, BRO. NACHOS. ALL THE NACHOS."
2. "BRO, I'M SO HUNGRY I COULD EAT A SURFBOARD."
3. "BRO, CHILI CHEESE NACHOS. LIKE, A MOUNTAIN OF THEM."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I'LL NAME MY FIRSTBORN AFTER YOU! BOY OR GIRL, I DON'T CARE!"
2. "BRO, I'M STARTING TO LOSE MY STOKE, BRO."
3. "FORSOOTH, MY BELLY DOTH RUMBLE MOST GRIEVOUSLY!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "LOOK, KIDS! IT'S HUNGER! WAVE HELLO TO HUNGER!"
2. "BRO, THERE'S LIKE A HUNDRED DUDES IN HERE, BRO."
3. "LOOK, KIDS! IT'S THE BACK OF THE LINE! IT NEVER MOVES!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "FORSOOTH, THIS IS INTOLERABLE!"
2. "YOU'VE ROLLED A NATURAL ONE ON TACO PREP!"
3. "BRO, NO, BRO. THAT'S A TOTAL WIPEOUT, BRO."

#### Served

Kitchen Shift: a ticket was served.

1. "BRO. BRO. THIS TACO IS A NATURAL TWENTY."
2. "BRO. THIS TACO IS, LIKE, A TEN."
3. "BRO. THIS. THIS RIGHT HERE, BRO."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "BRO! PERFECT! I WANT TO HUG YOU AND NEVER LET GO!"
2. "FORSOOTH! THE TACO GODS SMILE UPON US, BRO!"
3. "THAT WAS SO FAST, BRO. LIKE, BRO. BRO."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "BRO, I'M BAILING. THIS IS BUNK, BRO."
2. "FORSOOTH, I DEPART, AND THOU ART BOGUS!"
3. "LOOK, KIDS! IT'S A GUY LEAVING! WAVE GOODBYE!"

### c80punk



#### Delivered

Delivery Shift: the order arrived in good time.

1. "HUH. THE SYSTEM WORKS. FOR ONCE."
2. "NOT BAD. I'LL KEEP YOU OFF MY LIST."
3. "HOT AND ON TIME. DON'T TELL ANYBODY I SAID THANKS."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER. OKAY, THAT WAS PRETTY PUNK ROCK."
2. "RIGHT ON THE MAT. THE MAN COULDN'T THROW LIKE THAT."
3. "WHOA. THAT TOSS HIT HARDER THAN MY DRUMMER."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD. CORPORATE TACOS AT CORPORATE SPEED, MAN."
2. "YOU'RE ON MY LIST NOW. RIGHT UNDER MY LANDLORD."
3. "I'VE SEEN BURNOUTS AT A BUS STOP MOVE FASTER!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IT'S IN THE HEDGE. SMASH THE SYSTEM, NOT MY DINNER!"
2. "NICE THROW, POSER. IT'S ON THE ROOF."
3. "YOU MISSED THE PORCH, YOU TONE-DEAF TOOL!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT, YOU SUBURBAN ROAD HOG!"
2. "YOU ALMOST RAN ME DOWN! THAT'S A SONG NOW, JERK!"
3. "HEY! I'LL SPIT ON YOUR WINDSHIELD, YOU YUPPIE STOOGE!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY VAN! THE BAND LIVES IN THAT VAN, YOU CREEP!"
2. "YOU HIT MY CAR? GOOD. I HATE THAT CAR. PAY ME ANYWAY."
3. "PROPERTY DAMAGE! I'D RESPECT IT IF IT WASN'T MINE!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "BEAN BURRITO. I'M BOYCOTTING EVERYTHING ELSE."
2. "MY BAND PRACTICES AT FOUR. MOVE IT."
3. "SANCHO. NO SMALL TALK. I DON'T DO SMALL TALK."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "THIS IS WHAT CONFORMITY GETS YOU. A SLOW TACO."
2. "HEY, CORPORATE STOOGE! MOVE YOUR HANDS!"
3. "I'M WRITING A SONG ABOUT THIS. IT'S TEN SECONDS LONG."

#### Queue

Kitchen Shift: the line is past three customers.

1. "LOOK AT ALL YOU SHEEP. IN A LINE. FOR TACOS."
2. "THIS LINE IS MORE PACKED THAN A BASEMENT SHOW!"
3. "WHO'S RUNNING THIS PLACE? ANARCHY WOULD BE FASTER!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "THE TACO INDUSTRIAL COMPLEX STRIKES AGAIN!"
2. "SOMETHING STUNK IN THIS JOINT, AND IT WASN'T THE SALSA."
3. "THIS IS BUSH-LEAGUE!"

#### Served

Kitchen Shift: a ticket was served.

1. "OKAY, THIS IS NOT BUSH-LEAGUE. RESPECT."
2. "TAKE THAT, BAGEL SHOP ACROSS THE STREET."
3. "IT'S GOOD. I HATE THAT IT'S GOOD."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "OKAY. FINE. THAT WAS FAST. YOU'RE NOT A SELLOUT."
2. "PERFECT. I'M PUTTING YOU IN MY ZINE. NICELY."
3. "THAT WAS LOUD, FAST AND RIGHT. THAT'S PUNK, MAN."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M PUTTING THIS PLACE ON MY LIST!"
2. "I'M GETTING A BAGEL ACROSS THE STREET, YOU BUM!"
3. "I'M OUT. GO SELL OUT TO SOMEBODY ELSE, POSER!"

### c80yuppie



#### Delivered

Delivery Shift: the order arrived in good time.

1. "NOW THAT'S A HIGH PERFORMER, CHAMP."
2. "ON TIME. YOU'D LAST A WEEK ON MY FLOOR."
3. "PROMPT. WARM. YOU'RE BEATING THE MARKET, CHAMP."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! THAT'S A TOP-QUARTILE TOSS, CHAMP!"
2. "ON THE MAT! I'D PUT YOU ON THE FAST TRACK, PAL!"
3. "BULLSEYE! THAT'S A PERFORMANCE BONUS RIGHT THERE!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "YOUR CUSTOMER SATISFACTION IS IN THE TOILET, PAL!"
2. "I BILL TWO HUNDRED AN HOUR, TACO BOY! DO THE MATH!"
3. "COLD SANCHO. I'M SHORTING YOUR WHOLE COMPANY, PAL."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "MY SANCHO IS IN THE TOPIARY, YOU PEASANT!"
2. "IT'S ON MY ROOF! DO YOU KNOW WHAT THAT ROOF COST?"
3. "YOU TANKED, PAL. YOU TANKED RIGHT IN MY PETUNIAS."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT! THESE ARE ITALIAN LOAFERS, YOU HICK!"
2. "MY BLOOD IS WORTH MORE THAN YOUR CAR, YOU MANIAC!"
3. "SLOW DOWN, PEASANT! I'M ON THE PARTNER TRACK!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY BEEMER! DO YOU KNOW WHAT A BEEMER COSTS, PAL?!"
2. "THAT'S A GERMAN CAR, YOU KANSAS CORNDOG!"
3. "YOU SCRATCHED MY PORSCHE! I'LL LIQUIDATE YOU!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "IS THIS TACO GOURMET? I NEED IT GOURMET."
2. "I'M BILLING THIS LUNCH TO A CLIENT. GO."
3. "SOUR CREAM SANCHO. MAKE IT GOURMET."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I COULD'VE MADE TEN TRADES IN THE TIME YOU DIDN'T MAKE THIS TACO!"
2. "THIS IS NOT WHAT HIGH PERFORMERS DO!"
3. "I'M NOT ANGRY. I'M JUST REALLOCATING MY RESPECT."

#### Queue

Kitchen Shift: the line is past three customers.

1. "I DON'T DO LINES. WELL, NOT THIS KIND."
2. "THIS LINE HAS THE WORST THROUGHPUT I'VE EVER SEEN!"
3. "SOMEBODY BUY THIS PLACE AND FIRE EVERYONE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "NO, NO. THAT'S NOT GOURMET. THAT'S A CRIME, PAL."
2. "WRONG! YOU JUST DOWNGRADED YOURSELF TO A SELL, CHAMP."
3. "IS THAT WHAT YOU CALL QUALITY CONTROL, PAL?"

#### Served

Kitchen Shift: a ticket was served.

1. "IT'S BASICALLY GOURMET. I'LL ALLOW IT."
2. "THIS IS A BUY RATING, PAL. STRONG BUY."
3. "IMPECCABLE. I'LL EXPENSE IT TWICE."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS! YOU'RE A HIGH PERFORMER, CHAMP! TRULY!"
2. "FASTER THAN MY BONUS CHECK CLEARS! BRAVO!"
3. "PERFECT TICKET. I'M PUTTING YOU IN MY ROLODEX."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "YOU'VE BEEN GONGED! GOODBYE!"
2. "I HAVE VERY SPECIAL SKILLS... AND ONE OF THEM IS COMPLAINING!"
3. "I'M TAKING MY PLATINUM CARD AND MY TASTE ELSEWHERE!"

### c80biker



#### Delivered

Delivery Shift: the order arrived in good time.

1. "ALL RIGHT. YOU GOT GUTS, KID."
2. "HOT TACOS AND A GOOD TOSS. RIDE ON."
3. "RIGHT ON TIME. YOU CAN RIDE WITH ME ANY DAY."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER. STEADY HANDS, KID. RESPECT."
2. "ON THE MAT! I'D PUT THAT TOSS ON MY JACKET!"
3. "WELL, HELL. I GOT A TEAR IN MY EYE AND IT AIN'T WIND."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "YOU'RE A REAL PIECE OF WORK, YOU KNOW THAT, BARNEY?"
2. "MY DOG DIED, MY TRUCK BROKE DOWN, AND NOW THIS!"
3. "COLD TACOS. I'VE BROKE NOSES FOR LESS, BARNEY."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "I OUGHTA DRAG YA BEHIND MY HOG!"
2. "MY BURRITO'S IN THE WEEDS! YOU WANT TO JOIN IT?!"
3. "ON THE ROOF?! YOU THROW LIKE A WET NAPKIN, BOY!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT, CAGER! I'LL RIP YOUR MIRRORS OFF!"
2. "YOU NEARLY CLIPPED ME, YOU BUG-EYED BARNEY!"
3. "TRY THAT AGAIN, PUNK. GO ON. I DARE YA."

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YOU DROPPED MY HOG! YOU DROPPED MY DAMN HOG!"
2. "THAT'S MY BABY YOU JUST HIT, YOU SON OF A-"
3. "YOU BETTER HAVE GOOD INSURANCE AND FAST LEGS, KID."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "RODE IN FROM SALINA. CHILI BURRITO."
2. "MY HOG'S PARKED CROOKED. MAKE IT QUICK."
3. "ONE CHILI SANCHO. AND DON'T STARE AT MY TATTOOS."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I'VE DONE THIRTY DAYS IN COUNTY FASTER THAN THIS."
2. "MY HOG'S COOLIN' OFF. MY TEMPER AIN'T."
3. "YOU KNOW HOW MANY BUGS I ATE GETTING HERE? MOVE IT!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE'S WORSE THAN STURGIS TRAFFIC, MAN!"
2. "SOMEBODY UP FRONT'S ABOUT TO GET A KNUCKLE SANDWICH!"
3. "I DON'T WAIT IN LINES. LINES WAIT FOR ME."

#### Wrong

Kitchen Shift: a wrong pick.

1. "THIS HERE TACO SHOP'S GOT A CRACKED FOUNDATION!"
2. "WRONG TOPPING, BARNEY. I'M CRACKIN' MY KNUCKLES."
3. "THAT AIN'T MY ORDER. PUT IT BACK BEFORE I GET UP."

#### Served

Kitchen Shift: a ticket was served.

1. "NOW THAT'S A TACO WORTH THE RIDE."
2. "BEST THING THAT'S HAPPENED TO ME ALL WEEK."
3. "THAT'S A TACO WITH SOME HAIR ON ITS CHEST."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FAST AND CLEAN! YOU'D MAKE A HELL OF A MECHANIC!"
2. "BEST THING SINCE MY FIRST HARLEY, KID."
3. "I'M TELLING THE WHOLE CLUB ABOUT YOU. NICE THINGS."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "YOU HAVEN'T SEEN THE LAST OF ME!"
2. "I'M OUT. I'LL BE REVVIN' MY HOG UNDER YOUR WINDOW."
3. "SCREW THIS JOINT. I'LL EAT ROADKILL ON THE WAY HOME."

### c80newwaveguy2



#### Delivered

Delivery Shift: the order arrived in good time.

1. "OH. YOU CAME. SORRY, I'M JUST... TOUCHED."
2. "MY DARK SOUL GROWS SLIGHTLY LIGHTER."
3. "IT'S WARM. LIKE A HUG. I DON'T LIKE HUGS. THANKS."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "ON THE MAT. EXACTLY ON IT. I'M HAVING FEELINGS. SORRY."
2. "DEAD CENTER. THE MOST BEAUTIFUL THING I'VE EVER SEEN."
3. "PERFECT. LIKE A SYNTH CHORD IN AN EMPTY ROOM."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD. LIKE EVERYTHING. LIKE ME. SORRY."
2. "MY TACOS DIED WAITING. I'LL WEAR BLACK FOR THEM."
3. "THE SUN SET. MY TACOS SET. I'M SO TIRED."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IT'S IN THE HEDGE. OF COURSE IT IS. OF COURSE."
2. "YOU THREW MY DINNER ON THE ROOF, YOU UNCULTURED LUMP!"
3. "SORRY, BUT YOU'RE A COMPLETE AND UTTER JACKASS. SORRY."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "SORRY! SORRY! WHY AM I SORRY? YOU ALMOST KILLED ME!"
2. "WATCH IT! AN HOUR ON THIS HAIR, YOU PHILISTINE!"
3. "OH GOOD. DEATH. NO, WAIT. NOT BY A TACO CAR."

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CAR. SORRY, I JUST NEED A MOMENT TO SCREAM."
2. "YOU HIT MY HATCHBACK, YOU OAF! MY SYNTH IS IN THERE!"
3. "THAT DENT IS A METAPHOR FOR MY LIFE. PAY FOR IT."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "SORRY, HI, SORRY. ONE SOFT TACO? SORRY."
2. "THE RECORD STORE CLOSES AT SIX. SORRY."
3. "SORRY. BEAN BURRITO. SORRY. I'M IN A BAND."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "WHAT PLANET ARE YOU LIVING ON, MR. ROBOTO?"
2. "MY DARK SOUL GROWS DARKER BY THE MINUTE."
3. "I'VE WRITTEN THREE SAD SONGS STANDING HERE. SORRY."

#### Queue

Kitchen Shift: the line is past three customers.

1. "SO MANY PEOPLE. SO MUCH NOISE. I NEED TO LIE DOWN."
2. "SORRY, IS THIS THE LINE? IT FEELS LIKE PURGATORY."
3. "EVERYONE IN THIS LINE HAS TERRIBLE TASTE IN MUSIC."

#### Wrong

Kitchen Shift: a wrong pick.

1. "THE MISE EN PLACE HERE IS IN ABSOLUTE SHAMBLES!"
2. "NO. SORRY. NO. THAT'S... GOD, THAT'S UGLY."
3. "THAT TOPPING IS SO WRONG IT'S PRACTICALLY DISCO."

#### Served

Kitchen Shift: a ticket was served.

1. "THE MISE EN PLACE IS IMMACULATE. SORRY. WOW."
2. "I CAME IN HUNGRY. I LEAVE CONTENT. ODD."
3. "IT'S PERFECT. I HATE HOW MUCH I LOVE IT. SORRY."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS. I FEEL SOMETHING. I THINK IT'S JOY. GROSS."
2. "THE MISE EN PLACE! THE SPEED! I'M WEEPING. SORRY."
3. "SO GOOD I MIGHT WEAR A COLOR TOMORROW."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "SORRY, BUT I THINK I MIGHT HAVE TO LEAVE, SORRY, I'M SORRY."
2. "I CAME IN HUNGRY. I LEFT EMPTY. STORY OF EVERY TACO SHOP IN TOWN."
3. "I WILL OUTLIVE THIS RESTAURANT, AND ITS SUNS!"

### c80aerobicsgirl



#### Delivered

Delivery Shift: the order arrived in good time.

1. "WHOO! PERFECT FORM ON THAT TOSS!"
2. "YOU HUSTLED! I CAN TELL! GREAT CARDIO!"
3. "RIGHT ON TIME! THAT'S WHAT I CALL ENDURANCE!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! TEN OUT OF TEN FORM, SWEETIE!"
2. "ON THE MAT! I'M DOING A HIGH KICK FOR YOU! HUP!"
3. "WHOO! THAT TOSS WAS A FULL-BODY WORKOUT TO WATCH!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD TACOS?! I DID A WHOLE CIRCUIT WAITING FOR YOU!"
2. "YOU HAVE THE STAMINA OF A WET SPONGE, BUDDY!"
3. "I BURNED FIVE HUNDRED CALORIES JUST BEING MAD AT YOU!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "MY DINNER'S IN THE HEDGE! STRETCH YOUR DAMN ARMS!"
2. "ON THE ROOF?! I'M NOT DOING A PULL-UP FOR A BURRITO!"
3. "TERRIBLE FORM! TERRIBLE FOLLOW-THROUGH! TERRIBLE YOU!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HEY! YOU NEARLY RUINED MY POWER WALK, YOU JERK!"
2. "WHOA! THAT'S CARDIO I DIDN'T SIGN UP FOR!"
3. "YOU ALMOST HIT ME! AND I'M WEARING NEON! HOW?!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CAR! I HAVE AEROBICS IN TEN, YOU BIG JERK!"
2. "YOU JUST DENTED MY RABBIT, YOU MEATHEAD!"
3. "GET OUT HERE! I CAN DEADLIFT YOUR BUMPER, PAL!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "MY BOOK CLUB STARTS IN 20 AND SO HELP ME GOD!"
2. "BOOK CLUB IN TWENTY! CHILI ENCHILADA!"
3. "I'M STILL IN MY LEOTARD. DON'T JUDGE."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I GOTTA GET BACK, I'M DOUBLE-PARKED OUT THERE!"
2. "THIS IS BAD FOR MY TARGET HEART RATE!"
3. "THE WORKOUT OF THE DAY IS WAITING ON DISAPPOINTMENT!"
4. "TUCKER, LEAVE THE SALSA! TUCKER! SIR - MY TACO!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "EVERYBODY MARCH IN PLACE! KEEP THAT BLOOD MOVING!"
2. "THIS LINE IS LONGER THAN MY INSTRUCTOR'S COOLDOWN!"
3. "I'M DOING LUNGES BACK HERE, AND I'M NOT HAPPY!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "DROP AND GIVE ME TWENTY... TACOS!"
2. "WRONG MOVE! FIVE, SIX, SEVEN, EIGHT, START OVER!"
3. "THAT'S NOT ON MY DIET OR MY TICKET, SWEETIE!"

#### Served

Kitchen Shift: a ticket was served.

1. "MY HEART RATE IS EXACTLY WHERE I WANT IT."
2. "I'M TELLING EVERYONE AT CLASS. GOOD THINGS!"
3. "PERFECT FUEL! I COULD DO A WHOLE CLASS ON THIS!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "WHOO! FASTEST TICKET IN TOWN! GIVE ME A HIGH FIVE!"
2. "YOU'RE A MACHINE! A TACO MACHINE! WITH GREAT CALVES!"
3. "POETRY IN MOTION, SWEETIE! AND KICK! AND TURN!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M GONNA TELL EVERYONE AT JAZZERCISE ABOUT THIS!"
2. "I'M JOGGING OUT OF HERE! AND I'M NOT COMING BACK!"
3. "I'M TELLING TUCKER! HE BITES, YOU KNOW!"

### c80skateboarder



#### Delivered

Delivery Shift: the order arrived in good time.

1. "THAT WAS A RAD TOSS, DUDE. TOTALLY GNARLY!"
2. "STOKED! YOU SHRED THE STREETS, MAN!"
3. "RIGHT ON TIME, DUDE! THAT'S A CLEAN LANDING!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! THAT'S A TEN FROM THE JUDGES, DUDE!"
2. "WHOA! YOU STOMPED IT ON THE MAT! SO SICK!"
3. "RAD! THAT WAS LIKE A PERFECT BONELESS, MAN!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD NACHOS, DUDE? THAT'S TOTALLY BOGUS."
2. "I COULD'VE LEARNED A WHOLE NEW TRICK WAITING, DUDE!"
3. "YOU'RE SLOWER THAN MY GRANDMA ON ROLLER SKATES!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "CHOKE ON A JOLT COLA, YOU LOSER!"
2. "MY TACOS ARE ON THE ROOF, YOU TOTAL POSER!"
3. "YOU BAILED, DUDE! MY DINNER'S IN THE BUSHES!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! YOU ALMOST RAN OVER MY DECK, YOU KOOK!"
2. "DUDE! YOU NEARLY MADE ME EAT CURB!"
3. "MOVE IT, OLD MAN! THIS IS A SKATE ZONE!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY DECK! YOU SNAPPED MY DECK, YOU BARNEY!"
2. "THAT'S MY MOM'S CAR! SHE'LL GROUND ME TILL I'M THIRTY!"
3. "YOU DINGED MY RAMP, YOU NIMROD! I BUILT THAT!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I KICKFLIPPED HERE. NACHOS, PLEASE!"
2. "MY DECK'S OUTSIDE. HARD TACO, QUICK!"
3. "CHILI CHEESE NACHOS, DUDE. I HAVE A SESSION AT FOUR."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "DUDE, I GOTTA BE AT THE PARK BEFORE IT CLOSES!"
2. "THIS IS SO NOT RAD. SO NOT RAD, DUDE."
3. "I COULD'VE LANDED A HUNDRED KICKFLIPS BY NOW!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I COULD KICKFLIP TO TIJUANA FASTER THAN THIS!"
2. "I'M HOLDING MY BREATH UNTIL I GET MY TACO!"
3. "THIS LINE IS DEADER THAN A CLOSED SKATE PARK."

#### Wrong

Kitchen Shift: a wrong pick.

1. "EVEN MY ARCH-NEMESIS MAKES BETTER TACOS THAN THIS!"
2. "BAIL! BAIL! THAT'S THE WRONG TOPPING, DUDE!"
3. "DUDE, THAT'S SO SKETCHY. TAKE IT OFF, MAN."

#### Served

Kitchen Shift: a ticket was served.

1. "THIS TACO HAS SERIOUS GNAR, DUDE."
2. "RADICAL. I'M TELLING THE WHOLE SKATE PARK."
3. "THAT'S A SICK TACO, DUDE. THANKS!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "WHOA! YOU SHREDDED THAT TICKET, DUDE! PERFECT LINE!"
2. "SO FAST I DIDN'T EVEN SEE YOUR HANDS, MAN!"
3. "DUDE! YOU'RE LIKE A PRO SKATER, BUT FOR TACOS!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I CAME FOR THE GNAR. I'M LEAVING WITH NADA."
2. "I'M OUTTA HERE, DUDE. THIS PLACE IS SO LAME."
3. "LATER, KOOKS! I'M GETTING CORN DOGS AT THE RINK!"

### c80videostoreclerk2



#### Delivered

Delivery Shift: the order arrived in good time.

1. "IT'S... IT'S HERE? ON TIME? WELL, GOSH."
2. "AND THE TWIST? IT'S STILL HOT!"
3. "HOT AND ON TIME. A MOVIE WITH A HAPPY ENDING."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! THAT GOES IN THE STAFF PICKS, GOSH!"
2. "WHOA! I'D REWIND THAT AND WATCH IT AGAIN!"
3. "ON THE MAT! THAT'S A FIVE-STAR TOSS. FIVE STARS!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD TACOS? THAT'S A STRAIGHT-TO-VIDEO DELIVERY."
2. "I'M CHARGING YOU A LATE FEE. A BIG ONE."
3. "THIS TOOK LONGER THAN A DOUBLE FEATURE, GOSH!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IT'S IN THE HEDGE? THAT'S THE WORST ENDING EVER!"
2. "I SAW THAT TWIST COMING. YOU STINK AT THIS."
3. "MY DINNER'S ON THE ROOF. THAT'S A HORROR MOVIE, PAL."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! I ALMOST BECAME A SLASHER FLICK, YOU MANIAC!"
2. "WATCH IT! I'VE GOT TWELVE OVERDUE TAPES IN THIS BAG!"
3. "YOU NEARLY HIT ME, YOU B-MOVIE JACKASS!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY HATCHBACK! THAT'S WHERE I KEEP THE RETURNS!"
2. "YOU DENTED MY CAR! I'M BANNING YOU FROM THE STORE!"
3. "OH, GOSH. OH, GOSH. YOU ABSOLUTE BOX-OFFICE BOMB!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I'M ON BREAK. THE LATE FEES CAN WAIT."
2. "QUICK SANCHO. WE'RE SHORT A CLERK TODAY."
3. "ONE SANCHEZ. NEW RELEASES COME IN AT FIVE."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "THIS IS LONGER THAN THE PREVIEWS ON A RENTAL!"
2. "I COULD HAVE WATCHED A WHOLE TRILOGY BY NOW!"
3. "GOSH, I'M NOT GONNA SAY IT. FINE: HURRY UP!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THE DINOSAURS WAITED LESS FOR THE METEOR!"
2. "THIS LINE IS WORSE THAN FRIDAY NIGHT AT THE STORE!"
3. "EVERYONE HERE IS RETURNING SOMETHING, AREN'T THEY?"

#### Wrong

Kitchen Shift: a wrong pick.

1. "I... I JUST DON'T... WELL, NO, I'M NOT GONNA SAY IT..."
2. "WHAT IS YOUR MAJOR MALFUNCTION, TACO MAKER?!"
3. "BUT! BUT! BUT IT GETS WORSE!"

#### Served

Kitchen Shift: a ticket was served.

1. "I'M NOT GONNA SAY IT. OKAY: IT'S GREAT."
2. "THIS ONE GETS THE FRONT SHELF. TOP RENTAL."
3. "I'D RENT THIS TACO AGAIN. NO LATE FEE."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "WOW! AND THE OSCAR GOES TO... THE TACO COOK!"
2. "FLAWLESS! A SEQUEL BETTER THAN THE ORIGINAL!"
3. "GOSH! SO GOOD I'M NOT GONNA SAY IT. OKAY. WOW!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M REPORTING YOU TO THE TACO COUNCIL!"
2. "I'M LEAVING. THE CREDITS ARE ROLLING ON THIS JOINT."
3. "THIS PLACE GETS ZERO STARS AND A LATE FEE!"

### c80girlwithlegwarmers



#### Delivered

Delivery Shift: the order arrived in good time.

1. "YOU'RE LIKE, THE BEST? LIKE, FOR REAL?"
2. "HI KIDS! TODAY WE LEARN GRATITUDE! THANKS!"
3. "OMIGOD, HOT TACOS? YOU'RE, LIKE, MY HERO?"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "ON THE MAT?! THAT'S, LIKE, A PERFECT PIROUETTE!"
2. "ON THE MAT! THAT'S, LIKE, A STANDING-OVATION TOSS!"
3. "DEAD CENTER! I'M DOING JAZZ HANDS FOR YOU! BOTH HANDS!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "YOU GUYS ARE LIKE, THE WORST? LIKE, LIT-ER-AL-LY?"
2. "COLD NACHOS? LIKE, WHAT AM I, A PENGUIN?"
3. "HI KIDS! TODAY WE LEARN WHAT COLD TACOS TASTE LIKE!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "LIKE, MY DINNER'S IN THE BUSHES? ARE YOU FOR REAL?"
2. "YOU THREW IT ON THE ROOF? THAT'S, LIKE, SO NOT OKAY!"
3. "UGH! YOU THROW LIKE MY STEPDAD DANCES!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "OMIGOD! YOU ALMOST RAN OVER MY LEG WARMERS!"
2. "WATCH IT, JERK! THESE LEGS ARE FOR DANCING!"
3. "LIKE, HELLO?! PEDESTRIAN?! WITH JAZZ SHOES?!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY MOM'S STATION WAGON! SHE'S GONNA, LIKE, KILL ME!"
2. "YOU HIT MY CAR? I'LL INTERPRETIVE-DANCE YOUR FUNERAL!"
3. "OMIGOD, YOU TOTAL DORK! THAT CAR IS, LIKE, BRAND NEW!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "DANCE CLASS IN TEN! LEG WARMERS ARE ON!"
2. "SOFT TACO, PLEASE! I'M MID-ROUTINE!"
3. "BEAN BURRITO, PLEASE! AUDITIONS ARE AT FOUR!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "HI KIDS! TODAY WE LEARN PATIENCE! BECAUSE I'M OUT OF IT!"
2. "I'M, LIKE, STRETCHING TO STAY CALM? IT'S NOT WORKING?"
3. "IF I MISS AUDITIONS I'M, LIKE, MOVING INTO YOUR KITCHEN."

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS LIKE A CONGA LINE BUT, LIKE, DEPRESSING."
2. "OMIGOD, IS EVERYBODY IN HAYS HERE? LIKE, EVERYBODY?"
3. "I COULD DO MY WHOLE RECITAL BEFORE THIS LINE MOVES!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "GAG ME WITH A SPOON."
2. "EW! EW! LIKE, PUT THAT DOWN? GROSS?"
3. "THAT'S NOT WHAT I ORDERED! LIKE, AT ALL! HELLO?"

#### Served

Kitchen Shift: a ticket was served.

1. "I'M PUTTING YOU IN MY ONE-WOMAN SHOW!"
2. "THIS IS SO GOOD I COULD DANCE. AND I WILL."
3. "OMIGOD, IT'S PERFECT! I'M, LIKE, TWIRLING!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "OMIGOD! SO FAST I'M, LIKE, SPEECHLESS? ALMOST?"
2. "PERFECT! YOU GET A WHOLE SCENE IN MY ONE-WOMAN SHOW!"
3. "HI KIDS! TODAY WE LEARN EXCELLENCE! FROM THIS COOK!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I HOPE YOUR SHOELACES ARE PERMANENTLY UNTIED!"
2. "I SHALL WRITE A ONE-WOMAN-SHOW ABOUT THIS EXPERIENCE!"
3. "I'M LEAVING! AND I'M DOING A DRAMATIC EXIT! WATCH!"

### c80miamiviceguy



#### Delivered

Delivery Shift: the order arrived in good time.

1. "IT WAS A HOT NIGHT. THE TACOS WERE HOTTER."
2. "SMOOTH MOVE, DRIVER. REAL SMOOTH."
3. "RIGHT ON TIME. YOU'RE CLEAN, DRIVER. FOR NOW."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER. THAT'S A PROFESSIONAL JOB, PAL."
2. "IT CAME OUT OF THE NIGHT AND LANDED ON THE MAT."
3. "NICE TOSS. I'VE BUSTED GUYS WITH WORSE AIM."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "IT WAS A COLD NIGHT. THE TACOS WERE COLDER."
2. "YOU'RE LATE. IN MY BUSINESS, LATE GETS YOU HURT."
3. "HONEY, THE TACOS ARE COLD. NO, I'M NOT BLAMING YOU."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "THE BAG'S IN THE HEDGE. SOMEBODY'S GOING DOWN FOR THIS."
2. "ON THE ROOF. NOW THAT'S EVIDENCE TAMPERING, PAL."
3. "YOU THREW IT IN THE BUSHES, YOU TWO-BIT AMATEUR!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! I'VE GOT A WARRANT FOR YOUR DRIVING, PAL!"
2. "YOU NEARLY HIT A COP! WELL, KIND OF A COP!"
3. "WATCH IT! THIS JACKET IS PASTEL, NOT ARMORED!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY FERRARI! WELL, IT'S THE DEPARTMENT'S! STILL!"
2. "YOU HIT MY CAR? YOU JUST MADE THIS PERSONAL."
3. "OUT OF THE CAR. SLOWLY. HANDS WHERE I CAN SEE 'EM."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I'M ON A STAKEOUT. TWO SANCHOS, TO GO."
2. "NO SOCKS, NO TIME. CHILI BURRITO, PAL."
3. "SOUR CREAM SANCHO. MY PARTNER'S WAITING IN THE CAR."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "DO YOU SEE THIS CELLULAR PHONE?! I AM ON A CALL!"
2. "IT WAS A SLOW NIGHT AT THE TACO JOINT... TOO SLOW."
3. "I'M THE LAW AROUND THESE PARTS - AND THE LAW SAYS MAKE MY TACO!"
4. "HONEY, I'M STILL AT THE TACO PLACE. WHAT DO YOU MEAN 'AGAIN'?!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE'S BACKED UP WORSE THAN THE COURTHOUSE."
2. "HONEY, I'M IN A LINE. NO, A TACO LINE. DON'T HANG UP."
3. "I'VE SAT ON STAKEOUTS SHORTER THAN THIS LINE."

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU'VE GOTTA BE PULLING MY LEG, PAL!"
2. "FREEZE! PUT THE SOUR CREAM DOWN, NICE AND SLOW!"
3. "THAT'S NOT WHAT I ORDERED, PAL. THAT'S A FRAME JOB."

#### Served

Kitchen Shift: a ticket was served.

1. "CASE CLOSED. THIS TACO IS CLEAN."
2. "HONEY, I'M AT THE TACO PLACE. IT'S GREAT."
3. "SMOOTH. LIKE A CIGARETTE BOAT AT MIDNIGHT."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FAST, CLEAN AND NO WITNESSES. I LIKE YOUR STYLE."
2. "HONEY, I'M NEVER COMING HOME. I LIVE HERE NOW."
3. "PERFECT. I'D TRUST YOU TO DRIVE THE GETAWAY CAR."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'LL SEE YOU IN COURT, YOU SOUR CREAM SCOUNDREL!"
2. "MY BUG-OUT BAG IS IN THE CAR, RUNNING!"
3. "I'M GONE. YOU NEVER SAW ME. THE TACOS NEVER HAPPENED."

### c80doctor



#### Delivered

Delivery Shift: the order arrived in good time.

1. "PROMPT AND WARM. YOUR VITALS ARE GOOD."
2. "FASTER THAN AN AMBULANCE. WELL DONE."
3. "RIGHT ON TIME. I PRESCRIBE A GENEROUS TIP."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER. STEADIER HANDS THAN MY RESIDENTS."
2. "ON THE MAT! I COULD USE YOU IN SURGERY, KID!"
3. "TEXTBOOK. ABSOLUTELY TEXTBOOK. I'M IMPRESSED."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "I BOUGHT A HOUSE FOR A NICKEL AND WAITED LESS THAN THIS!"
2. "SLOWER THAN A THREE-LEGGED MULE IN MOLASSES!"
3. "MY PORTFOLIO IS HEMORRHAGING AND YOU MADE IT WORSE!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "MY DINNER'S IN THE HEDGE. TIME OF DEATH: SIX-FIFTEEN."
2. "YOU MISSED THE PORCH BY A FOOT. GET YOUR EYES CHECKED."
3. "ON THE ROOF?! YOU HAVE THE AIM OF A SEDATED GOAT!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "I'M A DOCTOR! YOU NEARLY MADE ME A PATIENT!"
2. "SLOW DOWN! I'VE SCRAPED IDIOTS LIKE YOU OFF I-70!"
3. "YOU KNOW WHAT A PEDESTRIAN LOOKS LIKE AFTER THAT? I DO!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY MERCEDES! I'LL BILL YOU FOR EVERY STITCH!"
2. "YOU HIT MY CAR, YOU IMBECILE. I'M ON CALL!"
3. "THAT CAR NEEDS SURGERY, AND SO WILL YOUR WALLET!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I'M ON CALL. ONE BEAN BURRITO, STAT."
2. "I HAVE A PATIENT AT ONE. SOFT TACO."
3. "I HAVE TWENTY MINUTES BETWEEN ROUNDS. SANCHO."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "MEDICALLY, I'LL BE DEAD BEFORE THIS TACO ARRIVES!"
2. "TWENTY MINUTES. IN MY LINE OF WORK, THAT'S A LIFETIME."
3. "I'VE SEEN FASTER RECOVERIES FROM TRIPLE BYPASSES!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I'VE SEEN PRIVATES MOVE FASTER WITH PNEUMONIA!"
2. "THIS IS WORSE THAN THE ER ON A SATURDAY NIGHT!"
3. "IN TRIAGE, YOU'D ALL BE SENT HOME. ESPECIALLY YOU."

#### Wrong

Kitchen Shift: a wrong pick.

1. "STOP! THAT'S CONTRAINDICATED, YOU QUACK!"
2. "WRONG! IN MY OPERATING ROOM, YOU'D BE FIRED AND SUED!"
3. "WRONG INGREDIENT. THAT'S MALPRACTICE, DOCTOR TACO."

#### Served

Kitchen Shift: a ticket was served.

1. "DOCTOR'S ORDERS: ANOTHER ONE NEXT WEEK."
2. "MY DIAGNOSIS? A FINE CHILI ENCHILADA."
3. "PERFECTLY PREPARED. YOUR PROGNOSIS IS EXCELLENT."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS TECHNIQUE! YOU MISSED YOUR CALLING, SURGEON!"
2. "IN AND OUT. NO COMPLICATIONS. I'M GENUINELY MOVED."
3. "PERFECT! I'M WRITING THIS PLACE A PRESCRIPTION. DAILY."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M LEAVING AGAINST MEDICAL ADVICE. MY OWN."
2. "MY PATIENT IS IN BETTER SHAPE THAN THIS KITCHEN!"
3. "I'M PRONOUNCING THIS KITCHEN DEAD ON ARRIVAL."

### c80rockerchick



#### Delivered

Delivery Shift: the order arrived in good time.

1. "I LIFT THE HEX! YOU MAY LIVE, DRIVER!"
2. "THE SPIRITS FAVOR YOU. IT'S STILL HOT."
3. "THE CANDLES FORETOLD YOUR COMING. AND YOU CAME HOT."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! THE TAROT SAID YOU HAD IT IN YOU!"
2. "ON THE MAT! THE MOON IS PLEASED, AND SO AM I!"
3. "A PERFECT TOSS! I SHALL SPARE YOUR SOUL, DRIVER!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "THE TACOS ARE COLD AS A CRYPT. YOU ARE CURSED."
2. "MY CRYSTAL BALL SAYS YOU'RE A JACKASS. IT'S RIGHT."
3. "THE SPIRITS GOT HERE BEFORE YOU, AND THEY'RE DEAD!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "MY DINNER'S IN THE HEDGE! I HEX YOUR AIM FOREVER!"
2. "ON THE ROOF?! MAY CROWS NEST IN YOUR HAIR, FOOL!"
3. "IT'S IN MY HERB GARDEN! THE WOLFSBANE, YOU IDIOT!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT! I'LL TURN YOUR TIRES INTO TOADS!"
2. "YOU NEARLY RAN ME DOWN! MAY YOUR MUFFLER FALL OFF!"
3. "BY THE DARK MOON, YOU'LL PAY FOR THAT, HELLHOUND!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY HEARSE! YOU DENTED MY BEAUTIFUL HEARSE!"
2. "I CURSE YOUR CAR! MAY IT NEVER START IN THE COLD!"
3. "YOU HIT MY CAR?! YOUR NAME GOES IN A CANDLE TONIGHT!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I MUST FEAST BEFORE THE SUN GOES DOWN."
2. "ONE CHILI SANCHO. THE MOON WILL NOT WAIT."
3. "CHILI ENCHILADA. THE STARS ARE ALIGNING. HURRY."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "SUNSET IS IN TWO HOURS AND I REFUSE TO STILL BE HERE!"
2. "I CAN FEEL MY HEX COMING ON. IT'S IN MY FINGERS."
3. "THE MOON IS RISING AND MY PATIENCE IS SETTING!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I KNEW THE END TIMES WERE COMING AND THEY LOOK LIKE THIS!"
2. "THIS LINE IS CURSED. I CAN SMELL IT."
3. "I'VE SEEN SEANCES MOVE FASTER THAN THIS LINE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "I HEX THEE WITH WARM SOUR CREAM!"
2. "THAT TOPPING IS AN ABOMINATION! BEGONE!"
3. "WRONG! THE SPIRITS ARE SCREAMING AT YOU! HEAR THEM?"

#### Served

Kitchen Shift: a ticket was served.

1. "I BLESS THEE WITH COOL SOUR CREAM!"
2. "BY THE FULL MOON, THIS IS DELICIOUS!"
3. "THE SPIRITS APPROVE. THIS ONE IS BLESSED."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS! YOU MUST'VE SOLD YOUR SOUL FOR THAT SPEED!"
2. "BY THE FULL MOON AND ALL ITS FRIENDS, THAT WAS PERFECT!"
3. "I SHALL BLESS THIS KITCHEN WITH A GOOD-LUCK HEX!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M GONNA POLTERGEIST THIS PLACE!"
2. "I HEX YOU! I HEX THIS ESTABLISHMENT!"
3. "YOUR INSOLENCE SHALL BE PUNISHED, WITH THUNDER AND LIGHTNING!"

### c90club



#### Delivered

Delivery Shift: the order arrived in good time.

1. "YOU'RE ON THE LIST, DRIVER. FOREVER."
2. "THAT TOSS HAD A BEAT TO IT. RESPECT."
3. "BAG DROPPED RIGHT ON THE ONE. YOU GET A WRISTBAND."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! SOMEBODY CUE THE FOG MACHINE!"
2. "THAT TOSS HIT LIKE THE DROP. I'M LOOPING IT."
3. "BULLSEYE! THAT GETS YOU INTO THE BACK ROOM, DRIVER."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "MY NACHOS ARE COLDER THAN THE BOUNCER'S HEART!"
2. "I'VE PLAYED THREE-HOUR SETS FASTER THAN THIS!"
3. "COLD FOOD AT 4 AM? YOU ABSOLUTE BUZZKILL!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "YOU STAGE-DIVED MY DINNER INTO THE HEDGE!"
2. "YOU TOSS LIKE A DRUNK AT LAST CALL, PAL!"
3. "ON THE ROOF?! THAT'S THE CHILL-OUT ROOM, JACKASS!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT! I'M IN PLATFORM BOOTS, YOU MANIAC!"
2. "YOU DON'T RUN DOWN THE HEADLINER, YOU HACK!"
3. "YOU NEARLY TURNED ME INTO A REMIX, JACKASS!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY VAN! MY CRATES OF VINYL ARE IN THERE!"
2. "YOU DENTED THE PARTY BUS, YOU BASS-DEAF BASTARD!"
3. "THAT'S A BLACKLIST, DRIVER. EVERY CLUB IN KANSAS."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "DOORS OPEN AT TEN. FEED ME BY NINE!"
2. "VIP ORDER! VERY IMPORTANT PARTIER!"
3. "THREE SANCHOS. I SPIN AT MIDNIGHT. MOVE IT."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "MWAHAHAHA! ...WAIT, WHERE'S MY TACO?!"
2. "DROP THE BASS! DROP THE TACO! DROP SOMETHING!"
3. "I'VE BEEN HERE LONGER THAN THE COAT CHECK LINE!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS IS WORSE THAN THE BATHROOM LINE AT 2 AM!"
2. "WHO LET ALL THESE SQUARES PAST THE VELVET ROPE?!"
3. "I'D BRIBE THE BOUNCER IF THIS DUMP HAD ONE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "WRONG TRACK! YOU MIXED IN THE WRONG TRACK!"
2. "OFF THE BEAT, YOU TONE-DEAF TORTILLA TOSSER!"
3. "SCRATCH THAT! NO! I SAID SCRATCH THAT!"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS SANCHO IS THE AFTER-PARTY."
2. "THE DJ SAYS THANK YOU. I AM THE DJ."
3. "SANCHEZ IN HAND. NOW THE NIGHT CAN BEGIN."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS SET! I'M PUTTING YOU ON THE FLYER!"
2. "A PERFECT MIX, COOK. I'M SWEATING. I'M MOVED."
3. "MWAHAHA! WITH THIS TACO, I RULE THE DANCE FLOOR!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I CAME FOR TACOS. I LEAVE WITH TRAUMA."
2. "I'M TAKING YOU OFF THE GUEST LIST!"
3. "WE COME IN PEACE. WE LEAVE IN PROTEST."

### c90jock



#### Delivered

Delivery Shift: the order arrived in good time.

1. "TOUCHDOWN! RIGHT ON THE PORCH, BRO!"
2. "NICE ARM! YOU EVER PLAY QUARTERBACK?"
3. "SPECIAL TEAMS! YOU'RE ON SPECIAL TEAMS, BRO!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "RIGHT ON THE NUMBERS! THREADED THE NEEDLE, BRO!"
2. "DEAD CENTER! I'M GONNA CHEST-BUMP YOUR CAR!"
3. "WHAT A SPIRAL! COACH, ARE YOU SEEING THIS?!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "YOU COULDN'T MOVE THE CHAINS IF YOUR LIFE DEPENDED ON IT!"
2. "COLD! YOU RUN LIKE A LINEMAN WITH THE FLU!"
3. "MY MUSCLES ARE EATING THEMSELVES OUT HERE, BRO!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "INCOMPLETE! YOU THREW IT INTO TRIPLE COVERAGE!"
2. "IN THE BUSHES?! YOU BENCHWARMING BONEHEAD!"
3. "MY LAWN IS NOT THE END ZONE, DUMBASS!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! I'M THE STARTING TAILBACK, YOU JACKASS!"
2. "MY KNEES! I GOT A SCHOLARSHIP RIDING ON THESE!"
3. "ROUGHING THE PEDESTRIAN! FIFTEEN YARDS, BRO!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CAMARO! BRO! MY DAD IS GONNA KILL ME!"
2. "PERSONAL FOUL ON MY TRUCK, YOU MEATHEAD!"
3. "I'LL BENCH-PRESS YOUR CRAPPY LITTLE HATCHBACK!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "TWO-A-DAYS START AT THREE. HUSTLE!"
2. "CARB-LOADING FOR THE BIG GAME, BRO!"
3. "SIX HARD TACOS. COACH SAYS EAT BIG, BRO."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "YOU'RE COSTING ME MY FANTASY POINTS, BRO!"
2. "I'M MISSING THE ROYALS GAME OVER HERE!"
3. "I AM ENTERING MY CATABOLIC STATE!"
4. "HAIL MARY, FULL OF GRACE, WHERE IS MY TACO FROM THIS PLACE?"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE'S DEEPER THAN OUR DEPTH CHART, BRO!"
2. "BRO, IT'S A GOAL-LINE STAND IN HERE!"
3. "I'VE SEEN BETTER BLOCKING AT PEE WEE, BRO!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "ARE YOU TRYING TO MAKE ME CRY, SOLDIER?!"
2. "FALSE START! FALSE START ON THE BEANS!"
3. "THAT'S NOT THE PLAY I CALLED, MEATHEAD!"

#### Served

Kitchen Shift: a ticket was served.

1. "THAT'S PROTEIN, BABY! STRAIGHT TO THE PECS!"
2. "COACH WOULD CALL THAT A CLEAN REP."
3. "THAT'S A WIN, BRO. PUT IT ON THE BOARD."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "UNDEFEATED! YOU'RE GOING TO STATE, CHEF!"
2. "SOMEBODY DUMP THE GATORADE ON THIS GUY!"
3. "SPOTLESS! I WANNA PUT YOU ON MY SHOULDERS, BRO!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M PUNTING! YOU HEAR ME?! PUNTING!"
2. "YOU'RE CUT FROM MY ROSTER, YOU BUM!"
3. "GAME OVER! I'M HITTING THE SHOWERS, LOSER!"

### c90raider



#### Delivered

Delivery Shift: the order arrived in good time.

1. "THE PLUNDER ARRIVES! HUZZAH, COURIER!"
2. "A WORTHY TOSS, ROAD KNIGHT!"
3. "TRIBUTE RECEIVED! YOUR VILLAGE IS SPARED!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "BY ODIN'S BEARD! IT STRUCK THE MAT LIKE A SPEAR!"
2. "A TOSS FOR THE SAGAS! THE SKALDS SHALL SING!"
3. "DEAD CENTER! YOU MAY ROW MY LONGSHIP, COURIER!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD AS A FROST GIANT'S BACKSIDE, THIS!"
2. "MY HORDE HAS STARVED AND YOU BRING ME LEFTOVERS?!"
3. "THE MEAD WENT FLAT WAITING, YOU GOUTY SNAIL!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "YOU GORGON-FACED BLAGGART!"
2. "MY FEAST LIES IN THE THORNS, YOU BILGE RAT!"
3. "YOU HURLED MY SUPPER ONTO THE ROOF, PEASANT!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "BEGONE, CHARIOT OF THE DAMNED!"
2. "YOU NEARLY SENT ME TO VALHALLA, YOU SCURVY DOG!"
3. "HALT, IRON HORSE! I'LL HAVE YOUR HUBCAPS!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YOU RAMMED MY LONGBOAT TRAILER, KNAVE!"
2. "MY STEED! YOU'VE WOUNDED MY STEED, YOU BASTARD!"
3. "I CLAIM YOUR CART AS SPOILS OF WAR, VILLAIN!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "MY LONGSHIP SAILS AT NOON, COOK!"
2. "FEED THE HORDE! WE RIDE AT DUSK!"
3. "TEN BURRITOS! THE RAID LEAVES AT SUNDOWN!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "YOU'LL BE WALKING THE PLANK FOR THIS, TACO WENCH!"
2. "I'VE SACKED WHOLE TOWNS FASTER THAN THIS!"
3. "MY BEARD GROWS LONGER, COOK. AND SO DOES MY GRUDGE."

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS LONGER THAN A NORSE WINTER!"
2. "STAND ASIDE, SERFS! A WARLORD HUNGERS!"
3. "I'VE SEEN SIEGES END QUICKER THAN THIS LINE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "TREACHERY! THAT IS NOT MY SANCHEZ!"
2. "YOU MEAD-SOAKED MONGREL! WRONG BEANS!"
3. "LOKI HIMSELF GUIDES YOUR HAND, TRICKSTER!"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS SANCHEZ IS FIT FOR A WARLORD!"
2. "I SHALL SPARE THIS KITCHEN. FOR NOW."
3. "A FEAST FIT FOR THE HALLS OF VALHALLA!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "SKOL! THIS COOK SHALL SIT AT MY RIGHT HAND!"
2. "FLAWLESS! I WOULD FIGHT A DRAGON FOR THIS COOK!"
3. "THE GODS THEMSELVES GROW JEALOUS! HUZZAH!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'LL MAKE MY OWN TACOS! WITH BLACKJACK! AND POKER!"
2. "I SHALL REGALE THE BARDS WITH TALES OF THIS SLOW SERVICE!"
3. "MAY YOUR GUACAMOLE ALWAYS BROWN PREMATURELY!"

### c90rocker



#### Delivered

Delivery Shift: the order arrived in good time.

1. "HUH. SOMETHING WENT RIGHT. WEIRD."
2. "ON TIME? THAT'S SO NOT PUNK. THANKS."
3. "IT'S HOT. IT'S HERE. I'M SUSPICIOUS."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER. THAT'S... OKAY, THAT WAS SICK."
2. "BULLSEYE. GREAT. NOW I HAVE TO LIKE YOU."
3. "PERFECT TOSS. TOTALLY CORPORATE. I LOVE IT. UGH."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "THIS. IS. NPR. ...JUST KIDDING. THIS IS BAD SERVICE."
2. "COLD. LIKE MY DAD'S HUGS."
3. "IT TOOK SO LONG THE BAND BROKE UP."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "I KNEW IT. I KNEW HAPPINESS WAS AN ILLUSION."
2. "IN THE HEDGE. JUST LIKE MY FIRST ALBUM."
3. "YOU THREW MY DINNER IN THE MOSH PIT, JERK!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HEY! I'M NOT DYING BEFORE MY FIRST GIG, JERK!"
2. "WATCH IT, YOU YUPPIE ON WHEELS!"
3. "YOU ALMOST MADE ME A MARTYR, YOU POSER!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY VAN! THE AMPS ARE IN MY VAN, YOU JACKASS!"
2. "YOU DENTED MY CIVIC. IT'S ALL I OWN, MAN!"
3. "GREAT. NOW MY CAR MATCHES MY LIFE. TOTALED."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "SOUNDCHECK AT FIVE. CHILI CHEESE NACHOS."
2. "I SOLD THREE TAPES TODAY. I'M BUYING."
3. "NACHOS. AND A WATER CUP I CAN FILL WITH SODA."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I WROTE TWO SONGS ABOUT THIS WAIT. BOTH SUCK."
2. "THE MAN IS KEEPING MY TACO DOWN."
3. "THIS WAIT IS BASICALLY A CONCEPT ALBUM NOW."

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE HAS MORE POSERS THAN A MALL CONCERT."
2. "A MOSH PIT WITH NO MUSIC. WORST SHOW EVER."
3. "I'D CROWD-SURF UP FRONT IF YOU DORKS WERE TALLER."

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU ABSOLUTE TORTILLA GOBLIN!"
2. "WRONG BEANS, YOU SELLOUT SPATULA JOCKEY!"
3. "THAT'S NOT MY ORDER. THAT'S A COVER VERSION!"

#### Served

Kitchen Shift: a ticket was served.

1. "IT'S GOOD. DON'T TELL ANYONE I SAID IT."
2. "THIS TACO RULES. I HATE THAT IT RULES."
3. "IT'S GOOD. I'M STILL MAD ABOUT IT."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT. TOTALLY PERFECT. I FEEL SICK."
2. "BEST THING THAT'S EVER HAPPENED TO ME. GROSS."
3. "YOU'RE BASICALLY A ROCK STAR. DON'T SELL OUT."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I KNEW THIS PLACE WAS OVER WHEN THEY GOT AN ESPRESSO MACHINE!"
2. "MAY YOUR ONIONS MAKE YOU WEEP, ETERNALLY!"
3. "I'M OUT. THIS PLACE IS MORE PLASTIC THAN A MALL."

### c90soap



#### Delivered

Delivery Shift: the order arrived in good time.

1. "YOU'VE SAVED ME! CUE THE STRINGS!"
2. "DARLING, YOU HAVE IMPECCABLE TIMING."
3. "ON TIME! SOMEBODY CALL MY AGENT!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! I HAVEN'T BEEN THIS STIRRED SINCE MY COMA!"
2. "SUCH PRECISION! ARE YOU MY LONG-LOST SON?"
3. "BULLSEYE! DARLING, YOU'VE STOLEN MY SCENE!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "BITE ME, YOU SLACKER!"
2. "THIS IS A TRAGEDY IN THREE ACTS!"
3. "IT'S AS COLD AS MY SECOND EX-HUSBAND, YOU HACK!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "MY DINNER! IN THE ROSES! THE SYMBOLISM!"
2. "YOU MISSED, YOU TALENTLESS EXTRA!"
3. "IN THE BUSHES?! WITH THE TABLOIDS WATCHING?!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "YOU TRIED TO KILL ME! WHO HIRED YOU? VANESSA?!"
2. "WATCH IT! THIS FACE IS INSURED, YOU MANIAC!"
3. "NOT THE FACE! NEVER THE FACE, YOU BRUTE!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CONVERTIBLE! THIS MEANS WAR, YOU WRETCH!"
2. "YOU'LL HEAR FROM MY LAWYER. AND MY OTHER LAWYER."
3. "MY MERCEDES! THIS IS THE CLIFFHANGER OF YOUR LIFE!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I'M DUE ON SET FOR MY AMNESIA SCENE!"
2. "MY EVIL TWIN IS PARKED OUTSIDE. HURRY!"
3. "A QUESO MELT, DARLING. I'M DYING AT FOUR."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I AM LITERALLY SWOONING OVER HERE!"
2. "THIS IS RUINING MY WHOLE LOOK!"
3. "I'VE BEEN BURIED ALIVE TWICE. THIS IS WORSE."

#### Queue

Kitchen Shift: the line is past three customers.

1. "I DON'T STAND IN LINES, DARLING. I MAKE ENTRANCES!"
2. "THIS LINE IS LONGER THAN MY CONTRACT DISPUTE!"
3. "SO MANY EXTRAS! WHERE IS CRAFT SERVICES?!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "FIE! FIE I SAY!"
2. "HOW DARE YOU! I SAID SOUR CREAM, YOU SNAKE!"
3. "BETRAYED! BY A TORTILLA! AGAIN!"

#### Served

Kitchen Shift: a ticket was served.

1. "THE ROLE OF A LIFETIME, ON A PLATE!"
2. "BRAVO! BRAVO! AN EMMY FOR THE COOK!"
3. "DARLING, THIS IS MY BEST SIDE. THE TACO SIDE."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "MAGNIFICENT! I'M HAVING YOU WRITTEN INTO THE SHOW!"
2. "FLAWLESS! I MAY FAINT. CATCH ME, DARLING!"
3. "I HAVEN'T FELT THIS ALIVE SINCE MY RESURRECTION!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M LEAVING! WITH MY DIGNITY AND MY SUNGLASSES!"
2. "YOU'LL NEVER SLING TACOS IN THIS TOWN AGAIN!"
3. "FADE TO BLACK! I'M GONE, YOU PHILISTINES!"

### c90hiphopkid



#### Delivered

Delivery Shift: the order arrived in good time.

1. "YO, THAT TOSS WAS FRESH! FOR REAL!"
2. "MY MOM SAYS THANK YOU. I SAY PHAT!"
3. "AW YEAH! MOM, THE TACOS ARE HERE!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "BOOM! RIGHT ON THE MAT! THAT WAS THE BOMB!"
2. "YO, YOU SHOULD BE IN THE NBA, FOR REAL!"
3. "NOTHING BUT NET! DID EVERYBODY SEE THAT?!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "MY GRANDMA MAKES TACOS FASTER AND SHE'S NINETY!"
2. "IT'S COLD! I COULD'VE MADE A SANDWICH, DUH!"
3. "I GREW AN INCH WAITING, AND I'M SHORT!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IT'S IN THE TREE! YOU THROW LIKE MY BABY BROTHER!"
2. "IT'S ON THE ROOF! YOU'RE WACK, DUDE! WACK!"
3. "THE DOG GOT IT! THE DOG GOT MY TACO!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! I'M TELLING MY MOM ON YOU!"
2. "YOU ALMOST RAN OVER MY BIKE, YOU BIG DORK!"
3. "HEY! KID CROSSING! YOU BLIND OR WHAT?!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY BIKE! YOU SMUSHED MY BIKE, MAN!"
2. "THAT'S MY DAD'S CAR! YOU'RE SO DEAD!"
3. "YOU HIT THE MAILBOX! THAT'S A FEDERAL CRIME, DUDE!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "MY BUS LEAVES IN FIVE MINUTES!"
2. "I GOT A DOLLAR AND SOME DIMES. A TACO!"
3. "CAN I GET NACHOS? I GOT EXACT CHANGE. ALMOST."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "WHERE MY TACOS AT, WHERE MY TACOS AT, WHERE MY TACOS AT?!"
2. "I WANT MY TACO NOW NOW NOW NOW NOW!"
3. "THIS IS TAKING LONGER THAN SUMMER SCHOOL!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS LONGER THAN THE LUNCH LINE AT SCHOOL!"
2. "SOMEBODY'S CUTTING! NO CUTSIES!"
3. "I'M GONNA BE LIKE THIRTY WHEN I GET A TACO!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "GET OUT OF HERE WITH THIS TACO NONSENSE!"
2. "EWW! I SAID NO ONIONS! GROSS, DUDE!"
3. "THAT'S WRONG! YOU'RE SO WACK AT THIS!"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS TACO IS ALL THAT AND A BAG OF CHIPS!"
2. "TEN STARS! I'M GIVING YOU TEN STARS!"
3. "SWEET! THIS IS PHAT! LIKE, SUPER PHAT!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "YOU'RE THE BEST TACO GUY IN THE WHOLE WORLD!"
2. "OH MAN! THAT WAS FASTER THAN MY MICROWAVE!"
3. "THAT WAS DOPE! I'M TELLING EVERYBODY AT SCHOOL!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "IF I COULD GIVE NEGATIVE STARS, I WOULD GIVE NEGATIVE TWELVE STARS."
2. "FINE! I'M GOING TO THE ARCADE INSTEAD!"
3. "I'M TELLING MY MOM, AND SHE'S GONNA YELL AT YOU!"

### c90girlpowerfan



#### Delivered

Delivery Shift: the order arrived in good time.

1. "THANK YOU! SORRY! THANK YOU SO MUCH!"
2. "MY HOROSCOPE SAID GOOD NEWS TODAY!"
3. "YAY! SLEEPOVER SAVED! YOU'RE A LIFESAVER!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "OH MY GOSH! RIGHT ON THE MAT! SORRY, I SCREAMED!"
2. "DEAD CENTER! MERCURY MUST BE OUT OF RETROGRADE!"
3. "THAT WAS SO GOOD I'M PUTTING IT ON MY WALL!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "IT'S COLD. IT'S OKAY! IT'S NOT OKAY. SORRY!"
2. "MY HOROSCOPE SAID DELAYS. I HATE THAT IT WAS RIGHT."
3. "SORRY, BUT EVERYBODY WENT HOME. SO. THANKS."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IT'S IN THE ROSEBUSH! SORRY! WHY AM I SORRY?!"
2. "YOU THREW IT ON THE ROOF?! THAT'S SO NOT COOL!"
3. "ON THE LAWN? MY DAD JUST MOWED, YOU DORK!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HEY! SORRY! WAIT, NO! YOU'RE SORRY!"
2. "WATCH WHERE YOU'RE GOING, YOU TOTAL CREEP!"
3. "YOU ALMOST HIT ME! I'M A SAGITTARIUS, WE BRUISE!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY MOM'S MINIVAN! I'M GROUNDED FOR LIFE!"
2. "SORRY! NO! I'M NOT SORRY! YOU'RE PAYING FOR THAT!"
3. "MY FIRST CAR! I'VE HAD IT FOR TWO DAYS!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "MY CHART WARNED ME ABOUT TODAY!"
2. "SORRY, HI! CAN I GET A SOFT TACO? SORRY!"
3. "SLEEPOVER AT SIX! WE NEED SNACKS!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I REALLY HATE TO BOTHER YOU, BUT, SORRY, MY TACO?"
2. "UM, HI, SORRY, IS MY TACO, LIKE, ALIVE?"
3. "I'M SO NOT TRYING TO BE RUDE, BUT HELLO?!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS LONGER THAN THE ONE FOR CONCERT TICKETS!"
2. "SORRY, EVERYBODY! IT'S NOT MY FAULT! IT'S HIS!"
3. "MY FRIENDS ARE WAITING IN THE CAR AND THEY'RE SO MAD!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "CAN YOU SPELL DISAPPOINTMENT? BECAUSE I CAN!"
2. "UM, SORRY, THAT'S NOT IT. LIKE, AT ALL."
3. "EW! NOT THE BEANS! SORRY! BUT EW!"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS IS GOING IN MY DIARY. THE GOOD PART."
2. "YOU'RE MY HERO! SORRY, IS THAT WEIRD?"
3. "OH MY GOSH, THANK YOU! YOU'RE THE BEST! SORRY!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT! YOU TOTALLY GET ME! BEST FRIENDS FOREVER?"
2. "THIS IS THE BEST DAY OF MY WHOLE ENTIRE LIFE!"
3. "YOU'RE GOING ON MY WALL! RIGHT NEXT TO THE POSTERS!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M TELLING MY ENTIRE HOMEROOM."
2. "THIS IS GOING IN MY DIARY!"
3. "SORRY, BUT NO. I'M LEAVING. SORRY! BYE!"

### c90nintendokid



#### Delivered

Delivery Shift: the order arrived in good time.

1. "QUEST COMPLETE! +100 EXPERIENCE!"
2. "TACO GET! YOU'RE A HIGH SCORE, DUDE!"
3. "SAVE POINT REACHED! TACOS ACQUIRED!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "CRITICAL HIT! RIGHT ON THE MAT! 1-UP!"
2. "PERFECT! THAT'S A HIDDEN BONUS ROUND, DUDE!"
3. "WHOA! YOU UNLOCKED THE SECRET ENDING!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "I HAVE +5 TO PATIENCE AND I'VE BURNED THROUGH ALL OF IT!"
2. "I BEAT TWO WHOLE WORLDS WAITING FOR THIS!"
3. "COLD TACOS? THAT'S A CONTINUE, NOT A WIN!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "YOU SHMORF!"
2. "IT'S IN THE BUSHES! THAT'S A WARP ZONE, DUMMY!"
3. "IT'S ON THE ROOF! YOU NEED A CHEAT CODE, DUDE!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HEY! I ONLY HAVE ONE LIFE LEFT, JERK!"
2. "YOU ALMOST TOOK MY LAST HEART, YOU DORK!"
3. "NO FAIR! YOU'RE LIKE A BOSS WITH A CAR!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YOU HIT MY BIKE! THAT'S AN INSTANT GAME OVER!"
2. "MY DAD'S CAR! I DIDN'T DO IT! HE DID IT!"
3. "YOU BROKE THE MAILBOX! MY GAME MAGAZINE COMES THERE!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I PAUSED MY GAME. THE CLOCK IS TICKING!"
2. "MY BROTHER HAS THE CONTROLLER. HURRY!"
3. "SOFT TACO, PLEASE. I'M ON THE LAST BOSS!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "MY MOM'S GONNA UNPLUG THE GAME IF I'M LATE!"
2. "THIS IS LIKE THE LONGEST LOADING SCREEN EVER!"
3. "I'M LOSING HEALTH! I CAN SEE MY HEARTS GOING!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS LIKE A LEVEL WITH NO SAVE POINTS!"
2. "MORE PEOPLE HERE THAN THE MALL AT CHRISTMAS!"
3. "CAN I USE A WARP PIPE TO GET TO THE FRONT?!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "CRAM IT WITH WALNUTS, UGLY!"
2. "HARK! WHAT TREACHERY IS THIS?!"
3. "WRONG ITEM! YOU GAVE ME THE POISON MUSHROOM!"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS HARD TACO RESTORES FULL HEALTH!"
2. "LEVEL UP! YOU ARE NOW A MASTER CHEF!"
3. "YES! THIS SANCHO GIVES ME AN EXTRA LIFE!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "HIGH SCORE! ENTER YOUR INITIALS, CHEF!"
2. "A PERFECT RUN! NO DAMAGE! YOU'RE A LEGEND!"
3. "YOU BEAT THE WHOLE KITCHEN WITHOUT DYING ONCE!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'LL SEE YOU AT HIGH NOON, TACO MAKER!"
2. "I'M GOING HOME! I HAVE A SAVE FILE TO PROTECT!"
3. "THIS PLACE IS THE WORST LEVEL EVER! I QUIT!"

### c90rbsinger



#### Delivered

Delivery Shift: the order arrived in good time.

1. "OOH, BABY, RIGHT ON TIME. RIGHT ON TIME."
2. "THAT TOSS WAS SMOOTH. SMOOTH LIKE ME."
3. "YOU CAME THROUGH FOR ME, BABY. YOU CAME THROUGH."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "RIGHT ON THE MAT. OOH, YOU HIT THAT HIGH NOTE."
2. "DEAD CENTER, BABY. THAT GAVE ME CHILLS. CHILLS."
3. "MMM. YOU KNOW JUST WHERE TO PUT IT, DON'T YOU?"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "YOU'RE BREAKING MY HEART. YOU'RE BREAKING MY HEART OVER HERE."
2. "COLD AS A BREAKUP SONG, AND TWICE AS SAD."
3. "YOU KEPT ME WAITING ALL NIGHT. NOT THE GOOD WAY."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "DINNER'S IN THE BUSHES. CUE THE KEY CHANGE OF PAIN."
2. "IN THE ROSES? THAT'S A SAD SONG, BABY."
3. "MISSED, MISSED, MISSED. LIKE MY LAST THREE LOVERS."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! WATCH IT! THESE PIPES ARE INSURED!"
2. "YOU ALMOST HIT ME! NOW I CAN'T HIT THE HIGH C!"
3. "SLOW IT DOWN, BABY! SLOW IT DOWN, YOU MANIAC!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY LEXUS, BABY! YOU HIT MY LEXUS!"
2. "YOU HIT MY CAR? OH, BABY, WE ARE BREAKING UP."
3. "THAT'S A REMIX ON MY BUMPER, YOU JACKASS."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "STUDIO TIME AT TWO. I NEED MY VOICE FED."
2. "CHICKEN SOFT TACO. GENTLE, LIKE A BALLAD."
3. "SOUR CREAM BURRITO, BABY. SMOOTH, LIKE ME."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I SEE... A LIGHT... IS THAT... GUACAMOLE?"
2. "CANCEL THE 2 O'CLOCK. CANCEL THE 3. I'M STILL AT THE TACO PLACE."
3. "I'VE HELD NOTES SHORTER THAN THIS WAIT, BABY."

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE'S LONGER THAN MY EXTENDED REMIX."
2. "EVERYBODY WANTS A PIECE OF ME. NOBODY'S COOKING."
3. "BABY, I DON'T WAIT IN LINES. LINES WAIT FOR ME."

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU WET HABANERO OF A HUMAN BEING!"
2. "OH NO, NO, NO, NO. THAT AIN'T MY LOVE SONG."
3. "WRONG NOTE! YOU HIT THE WRONG NOTE, YOU HACK!"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS ENCHILADA? FIVE OCTAVES OF FLAVOR."
2. "I MIGHT WRITE A SLOW JAM ABOUT THIS."
3. "OOH, YOU MADE IT JUST THE WAY I LIKE IT."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT, BABY! YOU'RE GOING IN THE LINER NOTES!"
2. "YOU HIT EVERY NOTE. EVERY. SINGLE. NOTE."
3. "THAT WAS SO GOOD I NEED A CIGARETTE."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "ENCORE? MORE LIKE ENCORE-NOT-COMING-BACK!"
2. "I'M GONE, BABY. GONE LIKE A ONE-HIT WONDER."
3. "THIS IS OUR LAST DANCE. AND YOU STEPPED ON MY FEET."

### c90grungechick



#### Delivered

Delivery Shift: the order arrived in good time.

1. "THE TACO CAME. HOPE IS REAL. GROSS."
2. "CORRECT DOOR. I'M ALMOST IMPRESSED."
3. "IT'S HERE. THE VOID IS SLIGHTLY LESS HUNGRY."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER. UGH. I HATE HOW MUCH I LIKED THAT."
2. "RIGHT ON THE MAT. NOW I HAVE TO WRITE A HAPPY POEM."
3. "THAT WAS BEAUTIFUL. NOBODY TELL MY THERAPIST."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD. LIKE THE UNIVERSE. LIKE MY MOTHER."
2. "IT TOOK SO LONG I DEVELOPED A WHOLE NEW ANGST."
3. "LATE AND COLD. SO, A METAPHOR FOR MY LIFE."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE HEDGE. NATURE HAS RECLAIMED MY BURRITO."
2. "YOU MISSED. MOST HONEST THING IN THIS TOWN."
3. "ON THE ROOF. CLOSER TO GOD THAN I'LL EVER BE."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "OH, PERFECT. DEATH BY TACO CAR. HOW POETIC."
2. "WATCH IT, YOU KHAKI-WEARING SUBURBAN DRONE!"
3. "HIT ME, I DARE YOU. ACTUALLY DON'T. I HAVE A SHOW."

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CAR WAS HELD TOGETHER BY STICKERS, YOU JERK!"
2. "YOU HIT MY CAR. IT'S FINE. NOTHING MATTERS. PAY ME."
3. "ANOTHER DENT. MY CAR IS A CRY FOR HELP NOW."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I HAVE A POETRY SLAM IN TWENTY MINUTES."
2. "BEAN BURRITO. NO SMILE, PLEASE."
3. "HARD TACO. I RELATE TO THINGS THAT BREAK."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I'D GIVE MY LEFT DOC MARTEN FOR A TACO RIGHT NOW!"
2. "I WILL NOT REST IN PEACE UNTIL MY TACO IS MADE!"
3. "I'VE WAITED SO LONG I'VE BECOME A COFFEE SHOP."

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS EVERYTHING WRONG WITH CAPITALISM."
2. "SO MANY PEOPLE. SO MANY TACOS. SO LITTLE MEANING."
3. "LIKE THE LINE OUTSIDE A SHOW FOR A REALLY BAD BAND."

#### Wrong

Kitchen Shift: a wrong pick.

1. "DECONSTRUCT THIS, YOU ABSOLUTE COWARD!"
2. "WRONG. EVERYTHING YOU TOUCH IS WRONG, SELLOUT."
3. "THAT'S NOT MY ORDER, YOU PREPPY LITTLE GREMLIN!"

#### Served

Kitchen Shift: a ticket was served.

1. "YOUR TORTILLAS ARE STORE-BOUGHT AND YOUR SOUL IS EMPTY!"
2. "FINE. IT'S GOOD. I FEEL SOMETHING. UGH."
3. "THE LEAST SELLOUT THING IN THIS TOWN."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT. FAST. I FEEL... JOY? MAKE IT STOP."
2. "FLAWLESS. I'M SHAVING MY HEAD IN YOUR HONOR."
3. "YOU MADE ME SMILE. I'LL NEVER FORGIVE YOU."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "QUOTH THE CUSTOMER: NEVERMORE!"
2. "I'M LEAVING. NOT THAT ANYONE EVER NOTICES."
3. "I'D RATHER EAT MY OWN POETRY. AND IT'S BAD."

### c90boybandheartthrob



#### Delivered

Delivery Shift: the order arrived in good time.

1. "FOR YOU, A SIGNED PHOTO! AND A TIP!"
2. "MY FANS WILL HEAR ABOUT YOU. GOOD THINGS!"
3. "BRILLIANT! TONIGHT'S BALLAD IS FOR YOU!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! TIGHTER THAN OUR CHOREOGRAPHY!"
2. "BULLSEYE! I'M BLOWING YOU A KISS. YOU'RE WELCOME."
3. "PERFECT! THE GUYS WILL DO A KEY CHANGE FOR YOU!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "HONKING RIDICULOUS, THIS IS!"
2. "COLD?! MY FAN CLUB WOULD NEVER DO THIS TO ME!"
3. "MY FROSTED TIPS HAVE MELTED WAITING FOR THIS!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IT'S IN THE HEDGE! WITH THE SCREAMING FANS!"
2. "YOU MISSED! MY BACKUP DANCERS HAVE BETTER AIM!"
3. "ON THE ROOF?! I'M NOT CLIMBING. I'M INSURED."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT! THIS FACE IS ON A LUNCHBOX!"
2. "YOU NEARLY KILLED THE CUTE ONE, YOU MANIAC!"
3. "HEY! YOU ALMOST WRECKED MY MOVES, YOU ROAD HOG!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "THE TOUR BUS! YOU HIT THE TOUR BUS, YOU DIPSTICK!"
2. "MY MANAGER WILL SUE YOU INTO THE NEXT MILLENNIUM!"
3. "MY LIMO! MY BEAUTIFUL WHITE LIMO! YOU ANIMAL!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "THE TOUR BUS IS IDLING! SANCHO, PLEASE!"
2. "SUNGLASSES ON. NOBODY KNOWS IT'S ME."
3. "SOFT TACO, PLEASE. AND DON'T TELL THE FANS."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "DO YOU KNOW WHO I AM?!"
2. "I NEVER... GOT TO... TRY... THE CHURROS..."
3. "I'LL TIP YOU GENEROUSLY! JUST MAKE THE TACO!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS WILL ABSOLUTELY DESTROY MY TOUR SCHEDULE!"
2. "FANS, PLEASE! ONE AUTOGRAPH AT A TIME!"
3. "I'VE SIGNED FORTY NAPKINS AND STILL NO FOOD!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "THAT'S NOT MY ORDER! I'M THE SENSITIVE ONE!"
2. "WRONG! THAT'S OFF-KEY, PAL! OFF-KEY!"
3. "NOT THE BEANS! NO BEANS BEFORE A SHOW, YOU NITWIT!"

#### Served

Kitchen Shift: a ticket was served.

1. "THAT'S A NUMBER ONE TACO, RIGHT THERE!"
2. "I'D PUT THIS ON MY TOUR RIDER."
3. "LOVELY! I'LL SIGN YOUR SPATULA ON MY WAY OUT."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PLATINUM! THIS TACO JUST WENT PLATINUM!"
2. "FLAWLESS! THE GUYS ARE GONNA BE SO JEALOUS!"
3. "YOU NAILED IT! I'M WRITING YOU A BALLAD! A SLOW ONE!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "THIS PLACE IS OVER. I'M CANCELLING MY ORDER."
2. "I'M GOING SOLO! FROM THIS RESTAURANT!"
3. "CANCEL THE SHOW! I'M TOO HUNGRY TO HARMONIZE!"

### c90miamiclubkid



#### Delivered

Delivery Shift: the order arrived in good time.

1. "SLICK MOVE, PAL! YOU'RE ALRIGHT!"
2. "I'M CALLING MY GUY ON THE CAR PHONE. YOU'RE GOOD."
3. "RIGHT ON TIME. YOU'RE A STAND-UP GUY."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! KID, YOU GOT A FUTURE IN THIS TOWN."
2. "BEAUTIFUL! I'M TELLING THE WHOLE CLUB YOU'RE MY GUY."
3. "NOW THAT'S A TOSS! I'D PUT MONEY ON YOU. I DID."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD FOOD? I'VE HAD GUYS FIRED FOR LESS, PAL."
2. "THE CHEESE IS STIFF. LIKE YOUR FUTURE, PAL."
3. "YOU KNOW WHAT LATE GETS YOU? NOTHING. THAT'S YOUR TIP."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "MY DINNER'S IN THE BUSHES? THAT'S DISRESPECT."
2. "YOU MISSED, PAL. WE'RE GONNA HAVE A LITTLE TALK."
3. "ON THE ROOF? WHAT AM I, A PELICAN?"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HEY! THIS SUIT IS PEACH SILK, YOU ANIMAL!"
2. "YOU KNOW WHO YOU ALMOST HIT?! NO! YOU DON'T!"
3. "WATCH IT! MY LOAFERS COST MORE THAN YOUR CAR!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CONVERTIBLE! YOU JUST BOUGHT YOURSELF A PROBLEM."
2. "THAT'S A LEASE, YOU BUM! MY GUY'S GONNA HEAR ABOUT IT!"
3. "YOU HIT MY CAR. NOW I GOTTA MAKE A PHONE CALL."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "MY FLIGHT TO MIAMI LEAVES AT SIX!"
2. "THE CLUB OPENS AT NINE AND I'M STARVING!"
3. "TWO CHICKEN BURRITOS. MAKE 'EM SNAPPY, CHIEF."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "SUCK AN EGG, YOU FLANNEL-WEARING FAILURE!"
2. "I'M A PATIENT GUY. THAT PATIENCE IS GONE."
3. "TICK TOCK, BUDDY. MY GUY'S DOUBLE-PARKED."

#### Queue

Kitchen Shift: the line is past three customers.

1. "I CAME HERE TO RAVE, NOT WAIT!"
2. "WHO ARE ALL THESE PEOPLE? THEY KNOW WHO I AM?"
3. "I DON'T STAND IN LINES. I KNOW A GUY WHO DOES."

#### Wrong

Kitchen Shift: a wrong pick.

1. "WHAT IS THIS? YOU MAKING A FOOL OUTTA ME?"
2. "HEY! THAT AIN'T WHAT I SAID, GENIUS!"
3. "SOUR CREAM? NEAR THIS SUIT? YOU GOT A DEATH WISH?"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS IS SOUTH BEACH GOOD. IN KANSAS!"
2. "PASTEL SUIT SAFE. NO DRIPS. YOU'RE GOLDEN."
3. "THAT'S CLASS, MY FRIEND. REAL CLASS."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT! YOU AND ME, WE'RE FAMILY NOW."
2. "FAST AND CLEAN. I COULD USE A GUY LIKE YOU."
3. "BEAUTIFUL! I'M SENDING YOU A BOTTLE OF THE GOOD STUFF."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "FORGET ABOUT IT!"
2. "THIS STAYS BETWEEN US... BUT YOU'RE DEAD TO ME."
3. "WHERE'S MY CAR PHONE?! I'M CALLING SOMEONE!"

### c90skater



#### Delivered

Delivery Shift: the order arrived in good time.

1. "RADICAL TOSS, BRO! TOTALLY STUCK IT!"
2. "BRO. BRO! YOU LANDED IT, BRO!"
3. "SICK! YOU SHREDDED THAT DELIVERY, BRO!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! THAT WAS A TOTAL KICKFLIP, BRO!"
2. "WHOA! YOU STUCK THE LANDING! TEN OUT OF TEN!"
3. "BRO! THAT TOSS WAS SO SICK I GOT GOOSEBUMPS!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "YOU'RE A REAL PRO... NOT! PLUS YOU'RE SLOW."
2. "THIS IS WICKED LAME, KID!"
3. "BRO, IT'S COLD. I SKATED TO THE PARK AND BACK."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "BRO, THIS IS GNARLY, AND NOT IN THE GOOD WAY!"
2. "BRO! YOU BAILED IT RIGHT INTO THE BUSHES!"
3. "IT'S ON THE ROOF, BRO. THAT'S A SLAM, NOT A TRICK."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! BRO! I WAS GRINDING THAT CURB!"
2. "YOU ALMOST ATE MY DECK, YOU KOOK!"
3. "WATCH IT, BRO! SKATERS HAVE RIGHT OF WAY! PROBABLY!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY BOARD! YOU SNAPPED MY BOARD, BRO!"
2. "BRO, YOU HIT MY MOM'S CAR. SHE'S GONNA FREAK, BRO."
3. "YOU TOTALED THE MAILBOX, BRO. I WAS GONNA OLLIE THAT."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "BRO, I SNAPPED MY DECK. NEED A TACO."
2. "SKATE PARK CLOSES AT SIX, BRO!"
3. "BRO, TWO BEAN BURRITOS. I GOT A SESSION AT FOUR."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "BRO. BRO. BROOOOO!"
2. "THIS IS SO NOT CHILL, BRO!"
3. "BRO, I COULD'VE LEARNED A WHOLE NEW TRICK BY NOW!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "BRO, THIS LINE IS GNARLIER THAN THE HALFPIPE!"
2. "BRO, LET ME SKATE TO THE FRONT. I'LL BE QUICK."
3. "THIS LINE IS SO NOT RADICAL, BRO. SO NOT RAD."

#### Wrong

Kitchen Shift: a wrong pick.

1. "BRO, NO. THAT'S A TOTAL BAIL, BRO."
2. "WHOA, WRONG BEANS! YOU'RE KOOKING OUT, BRO!"
3. "BRO, THAT'S NOT IT. THAT'S, LIKE, THE OPPOSITE OF IT."

#### Served

Kitchen Shift: a ticket was served.

1. "THIS TACO IS WICKED GNARLY. GOOD GNARLY."
2. "SO CHILL. YOU'RE SO CHILL, BRO."
3. "BRO. BRO. THIS SANCHO IS SO RADICAL, BRO."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "BRO! THAT WAS A PERFECT RUN! NO BAILS!"
2. "BRO, I'M GONNA PUT YOUR NAME ON MY GRIP TAPE!"
3. "YOU'RE, LIKE, A PRO, BRO. A TACO PRO. SPONSORED."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "LATER, BRO. AND I MEAN WAY LATER. LIKE NEVER."
2. "BRO, I'M BAILING. THIS PLACE IS SO NOT RAD."
3. "I'M OUT, BRO. I'LL GET A HOT DOG AT THE GAS STATION."

### c90alternativegirl



#### Delivered

Delivery Shift: the order arrived in good time.

1. "OKAY, THAT WAS NOT LAME. WHATEVER."
2. "I'LL PUT YOU ON A MIXTAPE. SIDE B."
3. "ON TIME. HOW VERY MAINSTREAM OF YOU."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER. OKAY, THAT WAS COOL. TELL NO ONE."
2. "RIGHT ON THE MAT. YOU'RE GOING ON SIDE A."
3. "PERFECT TOSS. I'M PRETENDING I DIDN'T SEE IT."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "I AM MORE CORPOREAL THAN YOUR COMMITMENT TO FAST SERVICE!"
2. "COLD NACHOS. VERY POST-MODERN. I HATE IT."
3. "I GOT THROUGH A WHOLE IMPORT ALBUM WAITING FOR THIS."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE HEDGE. HOW TERRIBLY EXPERIMENTAL."
2. "YOU THREW IT ON THE ROOF. IS THAT, LIKE, ART?"
3. "YOU MISSED, YOU MALL-RAT MAGGOT!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT, YOU TOP 40 SPEED FREAK!"
2. "YOU NEARLY HIT ME! I HAVEN'T EVEN BEEN DISCOVERED!"
3. "I WAS GONNA DIE YOUNG, BUT NOT LIKE THIS, JERK!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YOU HIT MY BEETLE! IT HAS A SOUL, UNLIKE YOU!"
2. "MY BUMPER STICKERS! YOU DENTED ALL MY OPINIONS!"
3. "GREAT. MY CAR IS ALTERNATIVELY SHAPED NOW."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "THE RECORD STORE CLOSES AT SIX."
2. "SOFT TACO. NO IRONY ON IT, PLEASE."
3. "BEAN BURRITO. I WAS VEGETARIAN BEFORE IT WAS COOL."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "THIS IS SO LAME."
2. "I'M COMPOSING A STRONGLY WORDED MIXTAPE ABOUT THIS."
3. "I'VE BEEN WAITING SINCE BEFORE THIS PLACE SOLD OUT."

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS FULL OF PEOPLE WHO LIKE TOP 40."
2. "A RECORD STORE LINE, BUT NOBODY HAS ANY TASTE."
3. "I'D LEAVE, BUT THAT'S WHAT THEY'D EXPECT."

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU ENCHILADA-EARED ENABLER!"
2. "ARE THESE HEIRLOOM TORTILLAS? I CANNOT EAT NON-HEIRLOOM TORTILLAS."
3. "THAT IS SO NOT WHAT I ASKED FOR, YOU POSER."

#### Served

Kitchen Shift: a ticket was served.

1. "THIS IS ACTUALLY GOOD. DON'T MAKE IT WEIRD."
2. "AUTHENTIC. I CAN TELL. MOSTLY."
3. "THIS IS GOOD. I'LL ONLY TELL MY COOL FRIENDS."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS. I'M MAKING YOU A WHOLE MIXTAPE. BOTH SIDES."
2. "OKAY, THAT WAS PERFECT. I'M ALMOST SMILING."
3. "FAST AND PERFECT. YOU'RE TOO GOOD FOR THIS TOWN."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "WHATEVER. THIS WHOLE PLACE IS DEAD TO ME ANYWAY."
2. "I'M LEAVING. I'LL BE IRONIC ABOUT THIS FOR YEARS."
3. "FINE. I'M GOING TO THE COFFEE SHOP. THEY GET ME."

### c90rapper



#### Delivered

Delivery Shift: the order arrived in good time.

1. "BABE. BABE! IT CAME. ON THE PORCH, BABE!"
2. "RIGHT ON TIME. YOU GOT A FAN FOR LIFE."
3. "BABE! HOT FOOD! I TOLD YOU THIS PLACE WAS LEGIT!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "BABE! DEAD CENTER! YOU SEE THAT, BABE?!"
2. "THAT TOSS HAD FLOW. I'M PUTTING IT IN A VERSE."
3. "RIGHT ON THE MAT! THAT'S A PLATINUM TOSS!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "BABE, IT'S COLD. BABE. THE TACO IS COLD."
2. "YOU'RE SLOWER THAN MY FIRST DEMO TAPE, CHIEF."
3. "LATE AND COLD? I'M WRITING A DISS TRACK ABOUT YOU."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "BABE! THEY THREW IT IN THE BUSHES, BABE!"
2. "YOU MISSED, YOU BUSH-LEAGUE BURRITO BUM!"
3. "ON THE ROOF? YOU THINK I'M CLOWNING? GO GET IT!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! YOU ALMOST HIT ME, YOU CLOWN!"
2. "BABE, YOU SEE THAT? HE TRIED TO KILL ME, BABE!"
3. "WATCH IT! I GOT A RECORD DEAL PENDING, JACKASS!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY RIDE! MY RIMS! BABE, THEY HIT THE RIMS!"
2. "YOU HIT MY CAR? YOU GOTTA BE CLOWNING ME!"
3. "BABE, GET HIS PLATE. I'M PUTTING HIM IN A SONG."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I GOT STUDIO TIME AND A RHYME ABOUT YOU."
2. "BABE'S IN THE CAR. TWO SANCHOS, QUICK!"
3. "WHAT'S GOOD, CHEF? BABE WANTS A QUESO MELT."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "YOU THINK THIS IS FUNNY? YOU THINK I'M CLOWNING HERE?"
2. "BABE. BABE. THEY HAVEN'T EVEN STARTED YET. BABE."
3. "BABE, I'M STARVING. I'M WASTING AWAY, BABE."

#### Queue

Kitchen Shift: the line is past three customers.

1. "BABE, LOOK AT THIS LINE. BABE. LOOK AT IT."
2. "THIS LINE'S LONGER THAN MY VERSE ON THE REMIX."
3. "I WAITED LESS AT THE LABEL, AND THEY HATE ME."

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU CARNITAS-CRANIUMED CLOWN!"
2. "YO, THAT'S NOT IT! YOU CLOWNING ME RIGHT NOW?"
3. "BABE, HE PUT THE WRONG CHEESE ON IT, BABE!"

#### Served

Kitchen Shift: a ticket was served.

1. "YOU'RE NOT CLOWNING. RESPECT, CHEF."
2. "CHEESE MELTED EVEN. YOU HEARD ME."
3. "BABE, THIS IS IT. THIS IS THE ONE, BABE."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT AND HOT. CHEF, YOU'RE ON MY ALBUM COVER."
2. "BABE! FLAWLESS! MARRY ME! NOT YOU, BABE. THE COOK!"
3. "FIVE MICS. FIVE MICS FOR THE COOK."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "MAY YOUR CHEESE NEVER MELT EVENLY!"
2. "SERVICE: ZERO STARS. FOOD: NEVER ARRIVED. ATMOSPHERE: APOCALYPTIC."
3. "BABE, WE'RE LEAVING. BABE. GET THE CAR."

### c90generationxguy



#### Delivered

Delivery Shift: the order arrived in good time.

1. "PUNCTUAL. HOW REFRESHINGLY UNIRONIC."
2. "YOU'VE RESTORED MY FAITH. SLIGHTLY."
3. "ON TIME. I DON'T KNOW HOW TO PROCESS THIS."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER. I FEEL SOMETHING. PROBABLY IRONY."
2. "FINALLY, SOMEONE IN THIS TOWN IS GOOD AT A THING."
3. "BULLSEYE. WE'RE A GENERATION OF LETDOWNS. NOT YOU."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "YOU'RE THE CRUNCH AT THE BOTTOM OF THE TACO BAG!"
2. "I HAVE A MASTER'S DEGREE, YOU KNOW!"
3. "COLD. LIKE MY PROSPECTS. LIKE MY STUDENT LOANS."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE BUSHES. A METAPHOR FOR MY TWENTIES."
2. "YOU MISSED. VERY IN TUNE WITH THE ZEITGEIST."
3. "ON THE ROOF. SURE. WHY NOT. NOTHING MATTERS, MAN."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! I HAVE A LIBERAL ARTS DEGREE, YOU MANIAC!"
2. "SLOW DOWN, YOU BABY BOOMER IN TRAINING!"
3. "GO AHEAD, HIT ME. I'VE GOT NO HEALTH INSURANCE."

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CIVIC! IT'S THE ONLY THING I'VE PAID OFF!"
2. "YOU HIT MY CAR. CLASSIC. THE SYSTEM WINS AGAIN."
3. "THAT'S MY MOM'S VOLVO, MAN. I LIVE IN HER BASEMENT."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "MY TEMP JOB WANTS ME BACK AT ONE."
2. "I'M BETWEEN CAREERS. ALSO, LUNCH."
3. "CHICKEN SOFT TACO. IT'S PAYDAY, SO, TWO."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "YOU PEOPLE AND YOUR CELL PHONES!"
2. "THIS IS REMINDING ME OF AN ESSAY I READ IN THE ATLANTIC."
3. "*LIES ON THE FLOOR AND KICKS*"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I KNEW THIS PLACE BEFORE IT WAS COOL. NOW IT'S JUST SLOW."
2. "THIS LINE IS A CRITIQUE OF LATE CAPITALISM."
3. "I'VE TEMPED AT THREE OFFICES WHILE THIS LINE MOVED."

#### Wrong

Kitchen Shift: a wrong pick.

1. "WRONG BEANS. THAT'S SO... CORPORATE OF YOU."
2. "WRONG, YOU CORPORATE TOOL WITH A SPATULA."
3. "I ASKED FOR AUTHENTIC. THIS IS A COMPROMISE."

#### Served

Kitchen Shift: a ticket was served.

1. "THIS IS THE ONE AUTHENTIC THING LEFT."
2. "I COULD WRITE A WHOLE ZINE ABOUT THIS."
3. "FINE. GOOD. I'LL ALLOW MYSELF THIS ONE JOY."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS. I DIDN'T KNOW EXCELLENCE STILL EXISTED."
2. "PERFECT AND FAST. YOU'RE ON THE COVER OF MY ZINE."
3. "WOW. YOU'VE GIVEN ME HOPE. I RESENT THAT."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "SELLOUTS! ALL OF YOU! ...I MEAN THAT KINDLY."
2. "I'M GOING HOME TO LIE ON THE FLOOR. AGAIN."
3. "WHATEVER, MAN. I'LL EAT AT THE GAS STATION."

### c90itguy



#### Delivered

Delivery Shift: the order arrived in good time.

1. "ZERO DOWNTIME! I'LL FAX A COMMENDATION!"
2. "JANET! IT'S HERE! TELL EVERYBODY!"
3. "JANET! THE TACOS HAVE ACHIEVED UPTIME!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! A ONE-IN-A-MILLION PACKET!"
2. "PERFECT! I'M SAVING THIS MOMENT TO A FLOPPY!"
3. "JANET! RIGHT ON THE MAT! SOMEBODY BACK UP THE DRIVER!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "THIS IS SLOWER THAN A 2400 BAUD MODEM!"
2. "COLD NACHOS. I'M LOGGING THIS AS A CRITICAL FAILURE."
3. "JANET, IT'S LATE! FILE A TICKET! FILE THREE!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IT'S IN THE HEDGE! FATAL ERROR, YOU DOLT!"
2. "ABORT, RETRY, FAIL? FAIL! YOU ALWAYS FAIL!"
3. "JANET! THE TACOS ARE ON THE ROOF! CALL FACILITIES!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! I'M CARRYING A HARD DRIVE, YOU MANIAC!"
2. "YOU NEARLY CRASHED ME, YOU ROLLING VIRUS!"
3. "YOU ALMOST CRUSHED MY POCKET PROTECTOR, JACKASS!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CAR! THE COMPANY BACKUP TAPES ARE IN THERE!"
2. "JANET! HE HIT MY CAR! GET THE INCIDENT FORMS!"
3. "YOU DENTED MY TAURUS! I'M FAXING YOUR INSURANCE!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "THE SERVER'S REBOOTING. I HAVE TEN MINUTES!"
2. "THE MAINFRAME IS DOWN AND SO AM I."
3. "CHICKEN BURRITO. I'M ON CALL. I'M ALWAYS ON CALL."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I AM LITERALLY GOING TO LOSE MY MIND, JANET!"
2. "RESISTANCE IS FUTILE, BUT APPARENTLY SO IS YOUR KITCHEN!"
3. "JANET, IF I DON'T EAT, THE NETWORK DOESN'T EAT!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I HAVE FORGOTTEN THE FACES OF MY CHILDREN!"
2. "THIS LINE HAS MORE LAG THAN OUR TOKEN RING!"
3. "THE QUEUE IS FULL! YOU NEED MORE PROCESSORS BACK THERE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "SYNTAX ERROR! THAT IS NOT IN MY ORDER!"
2. "GARBAGE IN, GARBAGE OUT, YOU KEYBOARD-LICKER!"
3. "THAT'S A HARDWARE FAILURE. THE HARDWARE IS YOUR HANDS."

#### Served

Kitchen Shift: a ticket was served.

1. "FLAWLESS. I'M ADDING YOU TO MY ROLODEX."
2. "BUG-FREE. NOT A SINGLE ERROR. BEAUTIFUL."
3. "OUTPUT VERIFIED. YOU'RE IN THE NEWSLETTER."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "ZERO BUGS! I'M PRINTING THIS ON THE DOT MATRIX!"
2. "PERFECT! JANET, PROMOTE THE COOK TO SYSADMIN!"
3. "FAST AND FLAWLESS! YOU'RE A 486 OF A HUMAN BEING!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M FAXING THIS TO HEAD OFFICE WITH A 7-PAGE MEMO!"
2. "WHEN THE GRID GOES DOWN, I'M GONNA LAUGH AT YOU ALL!"
3. "THIS IS A GROWTH OPPORTUNITY... FOR ME TO LEAVE!"

### c90ravergirl



#### Delivered

Delivery Shift: the order arrived in good time.

1. "SENDING YOU POSITIVE ENERGY, DRIVER!"
2. "YOUR AURA IS, LIKE, GLOWING RIGHT NOW!"
3. "OH WOW, YOU'RE, LIKE, MY NEW BEST FRIEND, DRIVER!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! THE UNIVERSE IS SO ALIGNED RIGHT NOW!"
2. "WHOA! THAT TOSS HAD, LIKE, A BASSLINE TO IT!"
3. "PERFECT! YOU GET ALL MY CANDY BRACELETS!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "IT'S COLD. MY CHAKRAS ARE SO BLOCKED RIGHT NOW."
2. "THE PARTY STARTED AN HOUR AGO, YOU SPACE CADET!"
3. "COLD NACHOS? THAT'S, LIKE, THE OPPOSITE OF PLUR."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IT'S IN THE BUSHES! THE BUSHES DON'T EVEN DANCE!"
2. "ON THE ROOF?! IS THERE A PARTY UP THERE? NO? JERK!"
3. "YOU MISSED! YOUR AURA JUST TURNED TOTALLY BROWN!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! YOU ALMOST SQUISHED MY WHOLE VIBE!"
2. "HEY! I'M WEARING, LIKE, FIVE POUNDS OF BEADS!"
3. "WATCH IT! SO MUCH NEGATIVE ENERGY, YOU JACKASS!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY BUS! I HAND-PAINTED IT, YOU BUZZKILL!"
2. "YOU DENTED MY CAR! I JUST GOT IT BLESSED!"
3. "YOU HIT MY RIDE! THE PARTY MAP WAS IN THERE!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "THE BUS TO THE PARTY LEAVES AT NINE!"
2. "NEW BATTERIES FOR MY DISCMAN. AND NACHOS!"
3. "CHICKEN NACHO SUPREME! I'VE DANCED SINCE FRIDAY!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "MY GLOWSTICKS ARE DYING AND SO IS MY PATIENCE!"
2. "I'VE BEEN DANCING IN PLACE FOR TEN MINUTES, DUDE!"
3. "THE SUN IS COMING UP AND I STILL HAVE NO NACHOS!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "MY PAGER DIED, MY DISCMAN DIED, AND MY WILL TO LIVE IS NEXT!"
2. "THIS LINE IS LONGER THAN THE WAREHOUSE DOOR!"
3. "EVERYBODY HOLD HANDS! WE'LL GET THROUGH THIS!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "MY BODY IS A TEMPLE, AND THAT'S NOT ON THE ALTAR!"
2. "THAT'S NOT IT! YOU'RE HARSHING MY WHOLE NIGHT!"
3. "EW, DUDE. THAT IS SO NOT THE VIBE OF MY ORDER."

#### Served

Kitchen Shift: a ticket was served.

1. "THIS QUESO MELT IS PURE HAPPY VIBES!"
2. "HERE, HAVE A BRACELET. YOU EARNED IT."
3. "THIS IS SO GOOD I WANNA HUG THE WHOLE KITCHEN!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT! YOU'RE GLOWING! LIKE, ACTUALLY GLOWING!"
2. "SO FAST AND PERFECT I THINK I'M FLOATING!"
3. "I'M GETTING YOUR NAME TATTOOED ON MY ANKLE!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M SENDING YOU NEGATIVE ENERGY FOR THIS!"
2. "PLUR IS DEAD, AND THIS TACO SHOP KILLED IT!"
3. "DOT DOT DOT... I... HAD... AN... EXPERIENCE..."

### c90technerd



#### Delivered

Delivery Shift: the order arrived in good time.

1. "LATENCY: ACCEPTABLE. ACCURACY: OPTIMAL."
2. "A CRITICAL HIT! RIGHT ON THE PORCH!"
3. "PACKET RECEIVED. CHECKSUM VERIFIED. THANK YOU."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! THAT'S A PLUS-FIVE TO DEXTERITY!"
2. "PERFECT! STATISTICALLY, THAT SHOULD NOT HAPPEN!"
3. "BULLSEYE! I'M POSTING THIS ON THE BBS TONIGHT!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "LATENCY: UNACCEPTABLE. TEMPERATURE: TRAGIC."
2. "I'VE DOWNLOADED FASTER ON A 14.4 MODEM!"
3. "YOU'RE SLOWER THAN WINDOWS BOOTING, YOU TROGLODYTE!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IT'S IN THE HEDGE! YOU ROLLED A ONE, YOU IMBECILE!"
2. "ON THE LAWN! PONG HAS BETTER COLLISION DETECTION!"
3. "YOU MISSED BY 4.7 METERS. I CALCULATED IT. CRETIN."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT! I HAVE ARMOR CLASS TEN, YOU BRUTE!"
2. "MY BRAIN IS WORTH MORE THAN YOUR CAR, YOU APE!"
3. "WHOA! I'M CARRYING A SCSI DRIVE! DO YOU KNOW THE COST?!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY MODEM IS IN THE BACK SEAT, YOU NEANDERTHAL!"
2. "YOU HIT MY CAR! I'LL HACK YOUR... CAR! SOMEHOW!"
3. "THAT'S MY MOM'S WAGON! SHE DRIVES ME TO GAME NIGHT!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I'M COMPILING. I HAVE FOUR MINUTES!"
2. "MY CAMPAIGN STARTS AT SEVEN. GO, GO!"
3. "CHICKEN HARD TACO. MY LEVEL 12 PALADIN IS HUNGRY."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "WHEN SOCIETY COLLAPSES, YOU'LL WISH YOU'D MADE MY TACO!"
2. "MY HIT POINTS ARE AT ONE. I CANNOT CAST 'EAT'!"
3. "THIS WAIT IS AN INFINITE LOOP. SOMEBODY BREAK IT!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I'VE SEEN DUKE NUKEM WITH BETTER CUSTOMER SERVICE!"
2. "THIS IS NOT SCALABLE!"
3. "THIS LINE IS A BOTTLENECK. ADD A SECOND PROCESSOR."

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU BLITHERING MUMPSIMUS!"
2. "DUNGEON MASTER, I ATTACK THE DARKNESS! AND THIS TACO SHOP!"
3. "SEGMENTATION FAULT! THAT IS NOT MY INGREDIENT!"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS PROCESS IS SCALABLE! I APPROVE!"
2. "I ROLL TO EAT. NATURAL TWENTY!"
3. "OUTPUT MATCHES SPECIFICATION. MOST SATISFACTORY."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS EXECUTION! ZERO BUGS! I MAY WEEP!"
2. "PERFECT! YOU'VE GAINED A LEVEL! AND MY RESPECT!"
3. "I'M WRITING YOU INTO MY CAMPAIGN AS A DEMIGOD!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "LOGGING OFF. PERMANENTLY. GOODBYE, CRUEL KITCHEN."
2. "I'M GOING HOME TO EAT CHEESE PUFFS AND PLAY DOOM!"
3. "THIS TRANSACTION IS TERMINATED, YOU PRIMITIVE!"

### c90preppycollegekid



#### Delivered

Delivery Shift: the order arrived in good time.

1. "EFFICIENT DELIVERY! I'LL TELL THE HOUSE."
2. "BRAVO, DRIVER! A TRIUMPH IN ONE ACT!"
3. "PUNCTUAL. DAD WOULD CALL THAT MANAGEMENT."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! I'M PUTTING YOU ON MY RESUME."
2. "A HOLE IN ONE! FATHER WILL HEAR OF THIS!"
3. "SUMMA CUM LAUDE TOSS! BRAVO, OLD SPORT!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD. LIKE MY FATHER'S HANDSHAKE."
2. "I'VE WRITTEN THESES FASTER, YOU TOWNIE!"
3. "YOUR TIP IS NOW A LEARNING OPPORTUNITY."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE HEDGE? YOU BUSH-LEAGUE BUFFOON!"
2. "MY BURRITO IS ON THE ROOF WITH THE KEG CUPS."
3. "SWING AND A MISS! STATE SCHOOL ARM, CLEARLY."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT! MY FATHER IS AN ATTORNEY!"
2. "YOU NEARLY HIT MY SWEATER! IT'S CASHMERE!"
3. "I HAVE AN INTERNSHIP, YOU MANIAC!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "THAT'S DAD'S SAAB! YOU'RE SO DEAD, TOWNIE!"
2. "I'LL SUE YOU INTO NEXT SEMESTER!"
3. "MY BUMPER! THAT'S A WHOLE SPRING BREAK!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "MIDTERMS AT ONE! FEED THE SCHOLAR!"
2. "DAD'S CARD. LET'S GO BIG. SANCHEZ, PLEASE."
3. "CHILI CHEESE NACHOS. FOR THE HANGOVER."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I OPTIMIZE MY TIME AND YOU ARE STEALING IT!"
2. "I HAVE A SEMINAR, YOU HAIRNETTED SLOTH!"
3. "TIME IS MONEY AND YOU ARE SPENDING DAD'S."

#### Queue

Kitchen Shift: the line is past three customers.

1. "HAVE YOU HEARD OF LEAN PRINCIPLES?"
2. "THIS LINE FLOWS WORSE THAN THE REGISTRAR!"
3. "I COULD PLEDGE A HOUSE IN LESS TIME!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "METHINKS THOU ART THE SLOWEST COOK IN ALL THE LAND!"
2. "WRONG! I'D FAIL YOU, BUT YOU NEVER ENROLLED."
3. "THAT'S NOT ON THE SYLLABUS, CHUCKLEHEAD!"

#### Served

Kitchen Shift: a ticket was served.

1. "SPLENDID. WORTH THE TUITION, FRANKLY."
2. "TOP MARKS. I SHALL INFORM THE DEAN."
3. "ACCEPTABLE. I'LL WRITE YOU A REFERENCE."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS! YOU MAY RUSH THE HOUSE!"
2. "FATHER WOULD HIRE YOU. I MEAN THAT."
3. "A PERFECT FOUR-POINT-OH OF A TICKET!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "ET TU, TACO SHOP?!"
2. "EXEUNT, PURSUED BY HUNGER!"
3. "I'M RUSHING OUT OF HERE, TACO BRO!"

### c90cluelessblonde



#### Delivered

Delivery Shift: the order arrived in good time.

1. "OH MY GOSH, YOU'RE, LIKE, A TOTAL HERO!"
2. "ON TIME? THAT IS SO NOT A CRISIS!"
3. "YAY! YOU ARE SO GETTING A HUGE TIP!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "RIGHT ON THE MAT! THAT IS SO MAJOR!"
2. "OH MY GOSH, YOU, LIKE, AIMED AND STUFF!"
3. "THAT WAS, LIKE, TOTALLY OLYMPIC!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "IT'S COLD. MY NACHOS ARE, LIKE, DEAD."
2. "I AGED. I LITERALLY AGED, YOU SLUG!"
3. "YOUR TIP JUST WENT TO THE MALL WITHOUT YOU."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "EW. EW. LIKE, EW."
2. "MY TACOS ARE IN THE SPRINKLERS! LOSER!"
3. "YOU THREW IT IN THE POOL?! IS THAT A JOKE?"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HELLO?! THESE SANDALS ARE ITALIAN!"
2. "YOU ALMOST HIT ME! I JUST GOT HIGHLIGHTS!"
3. "LEARN TO DRIVE, YOU TOTAL BARNEY!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "DADDY'S JEEP! YOU ARE SO GOING TO JAIL!"
2. "MY BUMPER! I'M TELLING EVERYONE YOU'RE UGLY!"
3. "THAT WAS MY BIRTHDAY CAR, YOU TROLL!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "THE MALL CLOSES AT NINE. THIS IS URGENT!"
2. "DADDY'S JEEP IS DOUBLE-PARKED!"
3. "ONE SOFT TACO. NO CHEESE. WELL, SOME CHEESE."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "THIS IS DISCRIMINATION AGAINST PUNCTUAL PEOPLE!"
2. "MOM, I CAN'T TALK, I'M HAVING A CRISIS. NO, A TACO CRISIS!"
3. "MY NAILS ARE DRYING AND SO IS MY PATIENCE!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS, LIKE, A HUMAN RIGHTS THING."
2. "I DON'T DO LINES. I DO VIP."
3. "WHY IS EVERYONE IN KANSAS IN HERE?!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "THIS IS, LIKE, TOTALLY... INCOMPETENT."
2. "UM, HELLO? I SAID CHICKEN, NOT, LIKE, THAT."
3. "DID YOU EVEN READ IT? IT'S IN ENGLISH!"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS TACO IS, LIKE, TOTALLY SUPREME!"
2. "I'M TELLING EVERYONE AT THE MALL. GOOD NEWS!"
3. "CUTE! THIS TACO IS SO CUTE!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "OH MY GOSH, YOU'RE A GENIUS! MARRY ME! KIDDING."
2. "PERFECT! I'M PUTTING YOU IN MY DIARY!"
3. "FAST AND PERFECT! LIKE A FAIRY TACO GODMOTHER!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "AS IF!"
2. "YOU'VE MADE A POWERFUL ENEMY TODAY, TACO PEASANT!"
3. "BYE! I'M TAKING MY CREDIT CARD AND MY CUTENESS!"

### c90rbsinger2



#### Delivered

Delivery Shift: the order arrived in good time.

1. "PRAISE BE! IT'S HERE AND IT'S HOT!"
2. "STRAIGHT-UP RESPECT, DRIVER. RESPECT!"
3. "HOT AND ON TIME. THAT'S A HIGH NOTE, BABY!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! HIT THAT NOTE, DRIVER!"
2. "ON THE MAT! SOMEBODY SAY AMEN!"
3. "THAT TOSS HAD FOUR-PART HARMONY!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD FOOD? LORD, GIVE ME STRENGTH."
2. "YOU TOOK LONGER THAN MY KEY CHANGE, HONEY!"
3. "THIS TIP JUST HIT THE LOW NOTE, BABY."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE ROSEBUSH?! LORD, HOLD MY EARRINGS!"
2. "MY SUPPER'S IN THE GUTTER! SHAME ON YOU!"
3. "THAT TOSS WAS FLAT, BABY. FLAT AS A PANCAKE!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! I GOT A TOUR TO FINISH, FOOL!"
2. "SLOW DOWN! THESE PIPES ARE INSURED!"
3. "SWEET MERCY! YOU NEARLY FLATTENED ME!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY TOUR VAN! YOU SORRY SON OF A-"
2. "YOU DENTED MY CADDY! I'LL SING AT YOUR TRIAL!"
3. "BLESS YOUR HEART, YOU JUST BOUGHT A BUMPER."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "REHEARSAL AT TWO! I CANNOT SING HUNGRY!"
2. "SORRY, SORRY! I'M IN A RUSH, BLESS YOU!"
3. "SOFT TACO, BABY. GOTTA KEEP THESE PIPES WARM."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "THIS IS STRAIGHT-UP DISRESPECT!"
2. "THIS IS OUTRAGEOUS! OUTRAGEOUS I TELL YA!"
3. "OH GOD ABOVE, HEAR THY HUNGRY SERVANT!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS LONGER THAN MY ENCORE!"
2. "SOMEBODY PASS A COLLECTION PLATE FOR SPEED!"
3. "I COULD'VE CUT A WHOLE ALBUM IN THIS LINE!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "OFF-KEY! THAT INGREDIENT IS OFF-KEY!"
2. "SORRY, HONEY, BUT THAT'S THE WRONG HYMN!"
3. "LORD FORGIVE HIM, HE KNOWS NOT WHAT HE GRABS!"

#### Served

Kitchen Shift: a ticket was served.

1. "OH, THIS IS HEAVENLY! I TELL YA!"
2. "MY CHOIR'S GONNA HEAR ABOUT THIS ONE!"
3. "MMM! THAT'S A SOLO RIGHT THERE, BABY!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "HALLELUJAH! CLEAN AND QUICK! AMEN!"
2. "THAT TICKET SANG, BABY! IT SANG!"
3. "STANDING OVATION! I'M SINGING YOUR NAME!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "SORRY, I REALLY AM SORRY, BUT I'M POLITELY GOING TO LOSE IT NOW."
2. "REMEMBER ME... FONDLY... AT TACO TUESDAYS..."
3. "I'M SORRY, BABY, BUT THIS SHOW IS OVER!"

### c90dopeybuddy



#### Delivered

Delivery Shift: the order arrived in good time.

1. "DUDE! THE TACO FOUND ME! HOW'D IT KNOW?"
2. "WHOA. YOU THREW IT. AND IT LANDED. WHOA."
3. "DUDE. YOU'RE LIKE A TACO MAILMAN."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DUDE! RIGHT ON THE MAT! DO IT AGAIN!"
2. "WHOA. THE MAT SAYS WELCOME. AND IT MEANT IT."
3. "DUDE, THAT WAS LIKE... GEOMETRY."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "I KNEW IT. THEY DON'T WANT US TO HAVE FAST TACOS!"
2. "DUDE, MY BURRITO IS COLD. LIKE, SAD COLD."
3. "I FORGOT I ORDERED. THEN I REMEMBERED. TWICE."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "DUDE! MY TACO'S IN THE TREE! IS IT A BIRD NOW?"
2. "WHOA. IT'S ON THE ROOF. HOW DO I GET UP THERE?"
3. "NOT COOL, DUDE. THE DOG IS EATING MY BURRITO."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "DUDE! I'M A PEDESTRIAN! I THINK!"
2. "WHOA! I ALMOST BECAME ROADKILL, DUDE!"
3. "DUDE, YOU JUST TOTALLY HARSHED MY WHOLE BODY!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "DUDE. MY CAR. IT WAS ALREADY UGLY, BUT DUDE."
2. "YOU HIT MY VAN! THE VAN IS MY HOUSE, DUDE!"
3. "MY BUDDY'S GONNA BE SO PISSED, DUDE."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "MY BUDDY'S IN THE CAR. HE SAYS HURRY."
2. "DUDE. I FORGOT WHAT I WANTED. A TACO?"
3. "UH, ONE OF EVERYTHING? NO. TWO OF EVERYTHING."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "DUDE IS NOT COOKING. DUDE IS LITERALLY NOT COOKING."
2. "I WANT THE TACOOOOOO!"
3. "DUDE, MY STOMACH IS TALKING. IT'S BEING MEAN."

#### Queue

Kitchen Shift: the line is past three customers.

1. "I'VE SEEN CONCRETE SET FASTER THAN THIS!"
2. "DUDE, THE LINE IS LIKE A SNAKE. A SLOW SNAKE."
3. "I'VE BEEN IN THIS LINE SO LONG I MADE FRIENDS."

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU'VE GOT TO BE KIDDING ME, DUDE!"
2. "DUDE. NO. THAT'S THE WRONG STUFF, DUDE."
3. "WHOA, THAT'S NOT MINE. OR IS IT? NO."

#### Served

Kitchen Shift: a ticket was served.

1. "DUDE CAN COOK. LIKE, REALLY COOK, DUDE."
2. "THIS TACO IS LIKE A HUG, DUDE."
3. "DUDE. FOOD. YOU GAVE ME FOOD. RESPECT."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "DUDE! SO FAST! ARE YOU, LIKE, A WIZARD?"
2. "THAT WAS PERFECT, DUDE. I MIGHT CRY."
3. "WHOA. THE TACO GODS ARE REAL AND IT'S YOU."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "DUDE, I'M OUT. MY BUDDY ATE THE SEATBELT."
2. "FORGET IT, DUDE. I'M GONNA EAT CEREAL."
3. "DUDE, THIS IS WHY NOBODY TRUSTS THE MAN."

### c90cyberpunkhacker



#### Delivered

Delivery Shift: the order arrived in good time.

1. "THE SYSTEM WORKED. FOR ONCE. NOTED."
2. "PAYLOAD DELIVERED. NICE WORK, RUNNER."
3. "TRANSFER COMPLETE. ZERO PACKET LOSS."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "ROOT ACCESS GRANTED, RUNNER. DEAD CENTER."
2. "TARGET LOCK CONFIRMED. CRITICAL HIT!"
3. "THAT TOSS WAS A NATURAL TWENTY!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "LAG. HORRIBLE LAG. YOU'RE A 2400 BAUD DRIVER."
2. "YOUR TIP HAS BEEN DELETED. NO BACKUP."
3. "COLD BURRITO. THIS IS A DENIAL OF SERVICE."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE SHRUBS? YOU BUFFER-OVERFLOWED IDIOT!"
2. "SYNTAX ERROR. BURRITO NOT FOUND ON PORCH."
3. "THE ROOF? YOU CORRUPTED MY DINNER, NEWBIE!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "I HAVE YOUR PLATE IN A DATABASE, MANIAC!"
2. "WATCH IT, YOU MEATSPACE MORON!"
3. "THAT WAS ALMOST A FATAL EXCEPTION, JERK!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CAR! I WILL HACK YOUR CREDIT SCORE!"
2. "YOU HIT MY HATCHBACK. ENJOY YOUR NEW F'S."
3. "MY BUMPER! I KNOW WHERE YOUR MODEM LIVES."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "THEY'RE WATCHING. ORDER FAST, ACT NORMAL."
2. "I PAID CASH. NO RECORDS. CHICKEN BURRITO."
3. "QUESO MELT. THE PAY PHONE GAVE ME SIX MINUTES."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "IS THIS REAL? AM I REAL? ARE TACOS REAL?!"
2. "I'M SETTING PHASERS TO STARVING!"
3. "THIS KITCHEN RUNS AT ONE MEGAHERTZ!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "WAKE UP, SHEEPLE! THIS IS TAKING TOO LONG!"
2. "THIS LINE IS A MEMORY LEAK. FIX IT!"
3. "EVERYONE IN THIS LINE IS A FED. I CAN TELL."

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU FRABBING SNARGLEPUSS!"
2. "THIS IS STRAIGHT-UP CHAOTIC EVIL, DUDE!"
3. "ON MY PLANET, THIS WOULD BE A WAR CRIME."

#### Served

Kitchen Shift: a ticket was served.

1. "TACOS ARE REAL. I CHECKED. THANKS."
2. "LAWFUL GOOD COOKING, DUDE. RESPECT."
3. "CHECKSUM VALID. BURRITO AUTHENTIC."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS EXECUTION. YOU'RE ELITE, COOK."
2. "ZERO BUGS. I'D SHIP THIS CODE."
3. "YOU JUST BEAT THE GAME. NO CHEAT CODES!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "BY THE OLD GODS AND THE NEW, I CURSE THIS KITCHEN!"
2. "LOGGING OFF. PERMANENTLY. RIP, TACO SHOP."
3. "CTRL-ALT-DELETE THIS WHOLE PLACE!"

### c90hiphophead



#### Delivered

Delivery Shift: the order arrived in good time.

1. "YO, THAT'S FRESH! YOU'RE THE BEST, DRIVER!"
2. "THIS IS NOT WACK. THIS IS THE OPPOSITE!"
3. "WORD! RIGHT ON TIME. THAT'S FLY."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "SLAM DUNK ON THE DOORMAT! DOPE!"
2. "DEAD CENTER! YOU GOT SKILLS, DRIVER!"
3. "THAT TOSS WAS SO DEF I NEED A MINUTE."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD FOOD? THAT IS WACK, MAN. WACK!"
2. "YOU TOOK SO LONG MY TAPE FLIPPED TWICE."
3. "LATE? YOUR TIP JUST GOT DISSED, CHUMP."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE HEDGES? YOU WACK-ARMED AMATEUR!"
2. "MY TACOS IN THE MUD! THAT'S A DIS, MAN!"
3. "YO, THE ROOF? WHO'S CLIMBING UP THERE? YOU?"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "YO! WATCH THE SNEAKERS! THEY'RE BRAND NEW!"
2. "YOU ALMOST HIT ME! I'M SOMEBODY, MAN!"
3. "SLOW DOWN, CRAZY! I GOT AN AUDITION!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY RIDE! I JUST GOT IT DETAILED, JACKASS!"
2. "YOU HIT MY CAR?! NOW I NAME THE PRICE!"
3. "THAT'S MY MOM'S CAR! SHE'S GONNA END US BOTH!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I HAVE A JOB INTERVIEW! I NEED THIS TACO FOR COURAGE!"
2. "MY RIDE IS OUTSIDE! NAME YOUR PRICE!"
3. "BIG AUDITION TONIGHT. FUEL ME UP!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "YO, AM I INVISIBLE? FRESH CUSTOMER HERE!"
2. "THE INTERVIEW IS IN TEN! THIS IS WACK!"
3. "I'LL PAY DOUBLE. TRIPLE. JUST MOVE, MAN!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "NAME YOUR PRICE! NAME IT!"
2. "FINE - I'LL TAKE SOMEONE ELSE'S TACO. I'LL PAY FOR THEIRS!"
3. "THIS LINE IS WACK. WACKER THAN WACK."

#### Wrong

Kitchen Shift: a wrong pick.

1. "THIS IS A CARDINAL SIN AGAINST TACOS, DUDE!"
2. "NAH, NAH. THAT IS NOT MY ORDER, MAN."
3. "YO, YOU JUST DISSED MY BURRITO!"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS IS WACK. THIS IS SO WACK."
2. "OKAY, I TAKE IT BACK. THIS IS DEF."
3. "PUT ME DOWN FOR THE NEXT GUY'S TOO!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "OKAY, THAT WAS FRESH. HALL OF FAME FRESH!"
2. "FAST AND PERFECT? YOU'RE DOPE, CHEF!"
3. "WORD UP! I'M GONNA CRUSH THAT INTERVIEW!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "PEACE OUT. AND I MEAN NO PEACE."
2. "I'M GONE. THIS PLACE IS OFFICIALLY WACK."
3. "MY RIDE LEFT AND SO DO I, CHUMPS!"

### c90riotgrrrl



#### Delivered

Delivery Shift: the order arrived in good time.

1. "RIGHT ON! YOU ROCK, DRIVER. LOUDLY!"
2. "ON TIME AND UNSMASHED. I'M SHOCKED."
3. "HOT AND HERE. SMASH THE CLOCK, DRIVER!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! THAT'S PUNK AS HELL!"
2. "BULLSEYE! YOU'RE GOING IN MY ZINE!"
3. "NAILED IT. I'D STAGE-DIVE ONTO THAT MAT."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "COLD AND LATE. JUST LIKE THE PATRIARCHY."
2. "LATE? YOUR TIP GOT SMASHED LIKE MY GUITAR."
3. "MY FOOD IS COLDER THAN MY EX'S HEART."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE PETUNIAS? YOU NO-ARM POSER!"
2. "ON THE ROOF?! I'M WRITING A MEAN SONG ABOUT YOU."
3. "NICE AIM, JERK. THE PORCH IS THE BIG FLAT THING."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HEY! I'M WALKING, JERK! LEARN TO STEER!"
2. "NEARLY HIT ME?! I'LL KICK YOUR BUMPER IN!"
3. "WATCH IT, CAR BOY! MY BOOTS HAVE STEEL TOES!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YOU HIT MY VAN! THAT'S MY WHOLE TOUR, JERK!"
2. "THOSE STICKERS WERE HOLDING MY BUMPER ON!"
3. "DENT MY CAR? I'LL SPRAY-PAINT YOURS."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "SHOW STARTS AT EIGHT. I'M ON FIRST!"
2. "I'M MAKING ZINES ALL NIGHT. FUEL, PLEASE!"
3. "BEAN BURRITO. NO MEAT. NO ARGUMENTS."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "YOU DON'T EVEN HAVE TO FOLD IT. I'LL FOLD IT MYSELF!"
2. "THIS IS A SIT-IN NOW. I'M NOT LEAVING HUNGRY!"
3. "FASTER! I HAVE A SET LIST AND A GRUDGE!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I'VE MOSHED THROUGH SHORTER CROWDS THAN THIS!"
2. "WE SHOULD UNIONIZE THIS LINE!"
3. "THIS LINE IS OPPRESSIVE AND IT SMELLS!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU UNWASHED CILANTRO STEM!"
2. "WRONG! DID THE MAN TELL YOU TO DO THAT?"
3. "NO MEAT! I SAID NO MEAT, YOU CARNIVORE!"

#### Served

Kitchen Shift: a ticket was served.

1. "THIS TACO IS A REVOLUTION. I APPROVE."
2. "FOLDED IT PERFECT. YOU'RE OKAY, COOK."
3. "RIGHT ON. YOU DIDN'T SELL OUT. THIS TIME."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FAST AND PERFECT! YOU'RE IN MY BAND NOW!"
2. "THAT RULED! I'M MAKING YOU A MIXTAPE!"
3. "FLAWLESS. I'M WRITING YOU A FAN LETTER."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'LL GET YOU, AND YOUR LITTLE TONGS TOO!"
2. "I WILL NOT BE SILENCED ABOUT THIS TACO!"
3. "MAY YOUR SALSA SEPARATE IN THE FRIDGE!"

### c90sk8terchick



#### Delivered

Delivery Shift: the order arrived in good time.

1. "HELLA RAD, DUDE. HELLA ON TIME."
2. "SICK TOSS! YOU SHOULD SKATE, DRIVER."
3. "RAD. HOT FOOD, NO BAIL. RESPECT."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "NAILED THE LANDING! HELLA CLEAN, DUDE!"
2. "DEAD CENTER! THAT'S A TEN FROM THE JUDGES!"
3. "SICK! YOU STOMPED IT RIGHT ON THE MAT!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "YOU QUESO-BRAINED QUITTER!"
2. "COLD? HELLA LAME, DUDE. HELLA."
3. "I COULD'VE SKATED TO MEXICO AND BACK."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE BUSH?! TOTAL BAIL, DUDE. TOTAL."
2. "YOU THREW IT ON THE ROOF, KOOK!"
3. "WEAK SAUCE. LITERALLY. IT'S ALL OVER THE LAWN."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! WATCH IT, KOOK! I'M SKATING HERE!"
2. "YOU ALMOST SNAPPED MY DECK, JERK!"
3. "LEARN TO DRIVE, YOU HELLA SKETCHY GRANDPA!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YOU HIT MY CAR! MY MOM'S GONNA FREAK!"
2. "MY BUMPER! THAT WAS MY BEST STICKER, LOSER!"
3. "NICE ONE, KOOK. NOW I'M SKATING EVERYWHERE."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I BAILED ON THE HALF-PIPE. NEED FOOD."
2. "MY RIDE LEAVES IN TEN. HELLA HURRY!"
3. "SOFT TACO. NO TALKING. JUST TACO."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "SKETCHY, DUDE. HELLA SKETCHY."
2. "CAN YOU SMELL WHAT THE TACO IS COOKING?! NO. BECAUSE IT ISN'T."
3. "I WILL LITERALLY PAY TRIPLE IF YOU JUST HAND ME A TORTILLA NOW."

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS A HELLA LONG GRIND."
2. "I COULD'VE LEARNED A KICKFLIP WAITING HERE."
3. "SKETCHY LINE. SUPER SKETCHY LINE, DUDE."

#### Wrong

Kitchen Shift: a wrong pick.

1. "LOSER SHOP. LOSER COOK. LOSER VIBES."
2. "SKETCH. THAT'S NOT MINE. HELLA SKETCH."
3. "WRONG STUFF, DUDE! TOTAL WIPEOUT!"

#### Served

Kitchen Shift: a ticket was served.

1. "WINNER SHOP. WINNER COOK. WINNER VIBES."
2. "THIS TACO IS NOT SKETCHY AT ALL. RAD."
3. "SICK. YOU GOT IT RIGHT. HELLA RIGHT."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FLAWLESS RUN! YOU WIN THE CONTEST, COOK!"
2. "FAST AND PERFECT? HELLA LEGIT, DUDE!"
3. "THAT WAS A PERFECT TEN, DUDE. NO BAILS."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "PEACE. I'M SKATING TO THE GAS STATION."
2. "LATER, KOOKS. HELLA LATER."
3. "THIS PLACE IS A BAIL. I'M GONE."

### c90raver



#### Delivered

Delivery Shift: the order arrived in good time.

1. "THE UNIVERSE DELIVERED. COSMICALLY RAD."
2. "I VISUALIZED IT AND HERE IT IS, MAN."
3. "OOH, IT'S WARM. I LIKE IT WARM, MAN."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER. I FELT THAT IN ALL MY CHAKRAS."
2. "THAT TOSS WAS SO SMOOTH MY PANTS GOT STATIC."
3. "OH, DRIVER. YOU HIT MY SPOT. THE DOOR SPOT."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "LATE? MY EX HAD THE OPPOSITE PROBLEM, MAN."
2. "MY NACHOS ARE COLD AND SO IS MY BODY GLITTER."
3. "I HAVEN'T BEEN THIS COLD SINCE THE FOAM PARTY."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "THE BUSHES? MAN, I'VE WOKEN UP IN THOSE BUSHES."
2. "THE ROOF. THAT'S WHERE I LOST MY PANTS IN '95."
3. "YOU MISSED, MAN. MY AURA IS SO SWEATY NOW."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! I'M WEARING NOTHING UNDER THESE PANTS, MAN!"
2. "SLOW DOWN! MY GLOW STICKS ARE IN PLACES!"
3. "YOU ALMOST HIT ME! MY NIPPLE RINGS ARE RINGING!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY VAN! WE MADE A LOT OF MEMORIES IN THAT VAN!"
2. "YOU DENTED THE LOVE BUS, MAN! THE LOVE BUS!"
3. "YOU HIT MY CAR! MY KARMA'S GOT A DENTED REAR!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "THE MOON IS FULL. I MUST EAT NOW."
2. "I'VE BEEN DANCING ALL NIGHT. NACHOS!"
3. "CHILI CHEESE NACHOS. I'VE BEEN SWEATY SINCE THURSDAY."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "THIS KITCHEN HAS BAD VIBES, I CAN FEEL IT!"
2. "MY BEAT DROP WAS SUPPOSED TO BE 20 MINUTES AGO!"
3. "I AM VISUALIZING MY TACO. I AM VISUALIZING IT."
4. "I HAVE TRAVELED BILLIONS OF LIGHT YEARS FOR FASTER SERVICE!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "STARS HAVE BEEN BORN AND DIED!"
2. "SO MANY BODIES IN HERE. I'M INTO IT, BUT HUNGRY."
3. "THIS LINE IS LONGER THAN MY LAST BACK RUB, MAN."

#### Wrong

Kitchen Shift: a wrong pick.

1. "COSMICALLY UNCOOL, MY DUDE. COSMICALLY."
2. "NOT THAT ONE, MAN. THAT HAS BAD ENERGY. AND GAS."
3. "WRONG, MAN. MY TUMMY SAYS NO. LOUDLY."

#### Served

Kitchen Shift: a ticket was served.

1. "COSMICALLY COOL, MY DUDE. COSMICALLY."
2. "THIS SOMBRERO IS IN TUNE WITH THE STARS."
3. "MMM. THAT QUESO FEELS LIKE A WARM BATH, MAN."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "PERFECT, MAN! I JUST HAD A FULL BODY EXPERIENCE!"
2. "SO FAST, SO GOOD. ALL MY GLOW STICKS WENT OFF, MAN."
3. "THAT TICKET MADE MY TOES CURL. ALL TEN, MAN."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M LEAVING TO GO BE SWEATY ELSEWHERE, MAN."
2. "BAD VIBES. I'M TAKING MY BODY AND MY GLITTER."
3. "PEACE, MAN. MY BLADDER AND I ARE OUT."

### c90grungeguy



#### Delivered

Delivery Shift: the order arrived in good time.

1. "THE VOID SENT A TACO. THE VOID CARES."
2. "HUNGER, MY OLD COMPANION, IS GONE."
3. "ON TIME. THAT ALMOST MADE ME FEEL SOMETHING."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER. I HATE HOW GOOD THAT FELT."
2. "ON THE MAT. FINE. THAT WAS KIND OF RAD."
3. "PERFECT. GREAT. NOW I HAVE TO HAVE HOPE."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "THE CLOCK TICKED. AND SO DID MY PATIENCE."
2. "COLD. LIKE EVERYTHING. LIKE ME."
3. "LATE? WHO CARES. I CARE. A LITTLE. JERK."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE MUD. WHERE I LIVE, EMOTIONALLY."
2. "ON THE ROOF. EVEN MY BURRITO WANTS TO LEAVE."
3. "NICE AIM, SELLOUT. IT'S IN THE STORM DRAIN."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! WATCH IT, YOU SPEED-METAL POSER!"
2. "WATCH IT! I'M BROODING HERE, JACKASS!"
3. "HEY! THESE CHUCKS ARE OLDER THAN YOUR CAR, MAN!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CAR WAS HELD TOGETHER BY DUCT TAPE AND HATE."
2. "YOU HIT MY VAN. THE AMP'S IN THERE, MAN!"
3. "MY BUMPER. GREAT. ANOTHER THING THAT'S BROKEN."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "BAND PRACTICE IN THE GARAGE AT TWO."
2. "BEAN BURRITO. FOR THE EMPTINESS."
3. "SOFT TACO. MAKE IT SAD. LIKE ME."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "COULD YOU BE ANY SLOWER?"
2. "THE VOID STARES BACK, AND IT'S HOLDING A SPATULA!"
3. "PAIN IS MY ONLY TRUE COMPANION. NOW ALSO: HUNGER."

#### Queue

Kitchen Shift: the line is past three customers.

1. "I DIED WAITING FOR A TACO. NOW I HAUNT THE LINE FOREVER."
2. "THIS LINE IS A METAPHOR. FOR LINES."
3. "WE'RE ALL JUST WAITING TO DIE. AND FOR TACOS."

#### Wrong

Kitchen Shift: a wrong pick.

1. "WRONG. OF COURSE IT'S WRONG. IT'S ALWAYS WRONG."
2. "THAT'S NOT MINE, MAN. NOTHING IS EVER MINE."
3. "YOU CORPORATE SPATULA SELLOUT!"

#### Served

Kitchen Shift: a ticket was served.

1. "PAIN IS STILL MY COMPANION. BUT FULLER."
2. "THIS IS THE LEAST BLEAK THING I OWN."
3. "IT'S GOOD. DON'T TELL ANYONE I SAID THAT."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FAST. PERFECT. I'M SUSPICIOUS OF JOY."
2. "WHOA. I SMILED. DON'T LOOK AT ME."
3. "FLAWLESS. I MIGHT WRITE A HAPPY SONG. NO."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "WHATEVER. I'LL STARVE. IT'S VERY ME."
2. "LEAVING. BACK TO THE GARAGE. BACK TO THE VOID."
3. "I'M OUT. YOU'RE JUST ANOTHER CORPORATE TACO."

### c90gangstarapper



#### Delivered

Delivery Shift: the order arrived in good time.

1. "YES YES YES YES YES YES YES!"
2. "FIVE STARS. FIVE BIG STARS. YOU EARNED 'EM."
3. "ON TIME. THE STAR IS PLEASED. TELL EVERYBODY."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! PUT THAT ON A PLATINUM PLAQUE!"
2. "BULLSEYE! THAT ARM IS SIGNED TO MY LABEL!"
3. "ON THE MAT?! FIVE STARS AND A GOLD CHAIN!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "LATE?! THE STAR DOES NOT WAIT! THE STAR WAITED!"
2. "COLD FOOD! ONE STAR! ONE COLD STAR!"
3. "MY ENTOURAGE AGED A YEAR. ALL SIX OF 'EM."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "NO NO NO NO NO NO NO!"
2. "IN THE BUSHES?! YOU'RE GOING IN A DIS TRACK!"
3. "ON THE ROOF?! MY BODYGUARD AIN'T CLIMBING THAT!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH IT! YOU ALMOST HIT A LEGEND!"
2. "WHOA! DO YOU KNOW WHO I AM?! SLOW DOWN!"
3. "NEARLY RAN ME OVER?! YOU'RE IN MY NEXT VERSE!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY LIMO! YOU HIT THE LIMO, YOU BUM!"
2. "MY RIMS! YOU SCRATCHED THE GOLD RIMS, CHUMP!"
3. "THAT CAR COST MORE THAN YOUR WHOLE TOWN!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I GOT A SHOW TONIGHT. FEED THE STAR!"
2. "MY DRIVER'S CIRCLING THE BLOCK!"
3. "FOUR HARD TACOS. THE ENTOURAGE IS HUNGRY."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I'LL TAKE IT RAW. I'LL TAKE IT BURNED. I DON'T CARE."
2. "THE STAR IS STARVING! THAT'S A HEADLINE!"
3. "HURRY UP! MY HYPE MAN IS LOSING HYPE!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I COULD'VE BOXED A KANGAROO IN LESS TIME!"
2. "A LINE?! I HAVE A VIP PASS FOR LIFE!"
3. "MOVE IT! MY LIMO METER IS RUNNING!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU'RE SOFT SHELL PRETENDING TO BE HARD!"
2. "SOFT! THAT'S SOFT! I ORDERED HARD!"
3. "THAT'S A BOOTLEG TACO, CHEF! A BOOTLEG!"

#### Served

Kitchen Shift: a ticket was served.

1. "NOW THAT'S A HARD SHELL THAT'S HARD!"
2. "RESPECT. YOU HANDLED BUSINESS, CHEF."
3. "THAT'S PLATINUM, CHEF. STRAIGHT PLATINUM."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "YES YES YES! FIVE STARS! SIX! SEVEN!"
2. "FAST AND FLAWLESS! YOU'RE MY PERSONAL CHEF NOW!"
3. "SHOUT-OUT TO THE COOK ON MY NEXT ALBUM!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "ONE STAR. ONE TINY STAR. AND ONLY BECAUSE I CAN'T GIVE ZERO."
2. "I'M GONE. ZERO STARS. I FOUND A WAY."
3. "WALKING OUT! THIS IS GOING ON THE ALBUM!"

### c90spicegirlfan



#### Delivered

Delivery Shift: the order arrived in good time.

1. "THE STARS ALIGNED! RIGHT ON TIME!"
2. "THIS IS GOING IN MY SLAM BOOK. AS A YES!"
3. "YAY! YOU'RE MY FAVORITE DRIVER! MY TOP ONE!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "RIGHT ON THE MAT! THAT'S, LIKE, DESTINY!"
2. "PERFECT! YOU GET A GOLD STAR STICKER!"
3. "WHOA! THAT'S GOING IN MY DIARY WITH HEARTS!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "I HAD A WHOLE TACO SLUMBER PARTY PLANNED!"
2. "COLD TACOS? YOU'RE OUT OF MY SLAM BOOK!"
3. "MY HOROSCOPE SAID TODAY WOULD BE BAD. IT WAS RIGHT."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "MY TACOS ARE ON THE TRAMPOLINE! GROSS!"
2. "THE ROOF?! I'M TELLING MY MOM ON YOU!"
3. "THE DOG ATE IT! YOU ARE SUCH A DWEEB!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "HEY! I'M ON MY BIKE, YOU DWEEB!"
2. "MOM! THAT CAR ALMOST HIT ME! GET HIS PLATE!"
3. "SLOW DOWN! I CAN'T RUN IN PLATFORM SHOES!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YOU HIT MY MOM'S MINIVAN! YOU ARE SO DEAD!"
2. "MOM'S GONNA GROUND YOU! CAN SHE GROUND YOU?!"
3. "THAT WAS OUR VAN! IT HAD STICKERS ON IT!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "MY CATS NEED TO BE FED AT FOUR O'CLOCK SHARP!"
2. "MY MOM'S IN THE MINIVAN. QUICK, PLEASE!"
3. "FIVE FRIENDS, FIVE TACOS. ONE EACH!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "THE STARS WERE ALIGNED FOR ME TO GET A TACO AT 12:15. WHERE IS IT?!"
2. "MY FRIENDS ARE WAITING IN THE VAN! HURRY!"
3. "THIS IS TAKING FOREVER! LIKE, FOREVER FOREVER!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS IS THE MOST TENSE MOMENT SINCE OUR TOWN!"
2. "THIS LINE IS LONGER THAN MY CHRISTMAS LIST!"
3. "EVERYONE IN THIS LINE IS SO NOT MY FRIEND."

#### Wrong

Kitchen Shift: a wrong pick.

1. "EW! THAT'S NOT MINE! THAT'S NOT ANYONE'S!"
2. "WRONG! I'M A GEMINI, I KNOW THESE THINGS!"
3. "NO NO NO! I SAID CHICKEN! CHICKEN!"

#### Served

Kitchen Shift: a ticket was served.

1. "SLUMBER PARTY IS BACK ON! THANK YOU!"
2. "THIS IS THE BEST DAY SINCE MY BIRTHDAY!"
3. "YAY! YOU'RE A TOTAL SWEETHEART, MISTER!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "SO FAST! YOU'RE MY NEW FAVORITE PERSON!"
2. "YOU'RE GOING IN MY SLAM BOOK. AS THE BEST!"
3. "THE STARS ALIGNED! THE TACO STARS!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "THIS IS GOING IN MY SLAM BOOK."
2. "I'M TELLING EVERYBODY AT SCHOOL YOU STINK!"
3. "COME ON, MOM. THIS PLACE IS SO LAME."

### c90backpacker



#### Delivered

Delivery Shift: the order arrived in good time.

1. "GOOD KARMA COMES BACK AROUND, DRIVER."
2. "YOUR AURA IS VERY PUNCTUAL, MAN."
3. "RIGHT ON TIME. THE UNIVERSE PROVIDES, MAN."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER. YOU'RE IN TOUCH WITH THE EARTH."
2. "ON THE MAT! THAT'S SOME ZEN ARCHERY, MAN."
3. "PERFECT. YOUR CHI IS UNBLOCKED, DRIVER."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "POMPEII HAPPENED FASTER THAN THIS!"
2. "COLD. YOUR KARMA JUST TOOK A HIT, MAN."
3. "I'VE MEDITATED THROUGH WHOLE SEASONS FASTER."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE HEDGE? YOU JUST FED A RACCOON, MAN."
2. "ON THE ROOF? THE BIRDS THANK YOU. I DON'T."
3. "YOU MISSED, YOU GAS-GUZZLING TREE KILLER!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! I'M WALKING TO DENVER, NOT HEAVEN!"
2. "SLOW DOWN, YOU EXHAUST-BELCHING BARBARIAN!"
3. "YOU ALMOST HIT ME AND MY GRANOLA, MAN!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY VW! SHE'S OLDER THAN YOU AND KINDER!"
2. "YOU HIT MY BUS, MAN. THAT'S BAD KARMA. BAD!"
3. "MY BUMPER SAID VISUALIZE PEACE, YOU NUMBSKULL!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I'M HITCHING TO DENVER AT DUSK, MAN."
2. "BEAN BURRITO, PLEASE. I WALKED FROM SALINA."
3. "SOFT TACO, NO MEAT. I'M ONLY HERE FOR THE BEANS."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "TERRY GROSS WOULDN'T STAND FOR THIS!"
2. "I'M JUST HERE TRYING TO FIND PEACE AND A SOFT TACO, MAN."
3. "MY PATIENCE IS INFINITE, MAN. EXCEPT NOW."

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS VERY BAD FOR THE PLANET, MAN."
2. "I'VE HITCHED RIDES QUICKER THAN THIS LINE."
3. "LET'S ALL BREATHE. NOW LET'S ALL MOVE, MAN."

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU WAFFLE-DRAGGING MUNCHBLISTER!"
2. "IS THAT MEAT?! I'VE BEEN VEGGIE SINCE '89!"
3. "WRONG, MAN. MY CHAKRAS ARE SCREAMING."

#### Served

Kitchen Shift: a ticket was served.

1. "THERE'S CHEMICALS IN THE SALSA, I JUST KNOW IT!"
2. "NO CHEMICALS. I CAN TELL. PEACE, MAN."
3. "THIS SOFT TACO HAS A GENTLE SOUL."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FAST AND PERFECT. YOU'RE AN OLD SOUL, COOK."
2. "WOW, MAN. THAT TICKET WAS TOTALLY ORGANIC."
3. "FLAWLESS. YOU'RE GOING IN MY TRAVEL JOURNAL."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M CLEANSING THIS PLACE OUT OF MY AURA, RIGHT NOW!"
2. "I'M HITCHING OUT. KEEP YOUR CORPORATE TACO."
3. "PEACE OUT. THE WILDERNESS SERVES FASTER."

### c90daria



#### Delivered

Delivery Shift: the order arrived in good time.

1. "ON TIME. I'LL TRY TO CONTAIN MYSELF."
2. "YOU FOUND THE HOUSE. A MODERN MIRACLE."
3. "YOU'RE ON TIME. I'M SURE IT WON'T LAST."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "ON THE MAT. YOUR PARENTS MUST BE SO PROUD."
2. "BULLSEYE. FINALLY, A SKILL THAT PAYS NOTHING."
3. "DEAD CENTER. I'LL MENTION IT IN MY NOVEL."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "WHATEVER, MOM."
2. "LATE AND COLD. LIKE MY PERSONALITY."
3. "TAKE YOUR TIME. I'LL JUST DIE OF OLD AGE."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "THE HEDGE. HOW SYMBOLIC."
2. "ON THE ROOF. AT LEAST YOU AIMED HIGH. ONCE."
3. "YOU MISSED A WHOLE PORCH. THAT TAKES WORK."

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "NEARLY KILLED BY A TACO CAR. HOW FITTING."
2. "WATCH IT, JACKASS. I'M WALKING SULLENLY HERE."
3. "SWERVE NEXT TIME. OR DON'T. NO, SWERVE."

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YOU HIT MY CAR. MOST EXCITING THING ALL WEEK."
2. "GREAT. NOW MY CAR LOOKS HOW I FEEL."
3. "MY PARENTS WILL SUE. IT'S THEIR ONLY HOBBY."

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I'M HERE TO AVOID A PEP RALLY."
2. "ONE TACO. HOLD THE ENTHUSIASM."
3. "CHICKEN SOFT TACO. MAKE IT QUICK AND JOYLESS."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I'VE HAUNTED THIS PLACE SINCE 1872. SERVICE HAS GOTTEN WORSE."
2. "I CAME IN YOUNG. I'LL LEAVE BITTER. MORE BITTER."
3. "TAKE YOUR TIME. MY CONTEMPT IS RENEWABLE."

#### Queue

Kitchen Shift: the line is past three customers.

1. "I NO LONGER REMEMBER WHAT HUNGER FEELS LIKE."
2. "EVEN THE RAVENS HAVE ABANDONED THIS PLACE."
3. "A LINE. HOW DELIGHTFULLY HUMAN."

#### Wrong

Kitchen Shift: a wrong pick.

1. "THIS IS SO BENEATH ME."
2. "WRONG. BUT I ADMIRE YOUR COMMITMENT TO IT."
3. "THAT'S NOT MY ORDER. THAT'S BARELY FOOD."

#### Served

Kitchen Shift: a ticket was served.

1. "IT'S ADEQUATE. THAT'S MY HIGHEST PRAISE."
2. "I FELT A FLICKER OF JOY. IT PASSED."
3. "CORRECT. I'M AS SHOCKED AS YOU ARE."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FAST AND PERFECT. I'M DEEPLY UNCOMFORTABLE."
2. "COMPETENCE. I'D FORGOTTEN WHAT IT LOOKED LIKE."
3. "FLAWLESS. I'LL TRY NOT TO WEEP OPENLY."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M LEAVING. TRY TO CONTAIN YOUR GRIEF."
2. "GOODBYE. I'LL BE MISERABLE SOMEWHERE ELSE."
3. "I'D STAY, BUT I'D RATHER NOT."

### c90skaterkid



#### Delivered

Delivery Shift: the order arrived in good time.

1. "BEST DAY OF MY WHOLE ENTIRE LIFE!"
2. "SWEET! YOU OLLIED IT RIGHT ONTO THE PORCH!"
3. "SWEET! HOT TACOS! YOU'RE RAD, MISTER!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "WHOA! RIGHT ON THE MAT! TEACH ME THAT!"
2. "DEAD CENTER! THAT'S LIKE A TEN-STAIR OLLIE!"
3. "NO WAY! YOU HAVE TO DO THAT AT MY SCHOOL!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "THIS IS THE WORST DAY OF MY WHOLE ENTIRE LIFE!"
2. "IT'S COLD! I'M TELLING MY BIG BROTHER!"
3. "I GREW AN INCH WAITING! A WHOLE INCH!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "AY, CARAMBA! AND I MEAN IT THIS TIME!"
2. "MY TACO'S IN THE GUTTER! YOU DORKWAD!"
3. "THE ROOF?! I CAN'T REACH, YOU DINGUS!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! WATCH IT! I'M JUST A KID!"
2. "HEY! YOU ALMOST HIT MY BOARD! AND ME!"
3. "SLOW DOWN, YOU OLD DORK! I'M TELLING!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "YOU HIT MY BIKE! I SAVED UP FOR THAT!"
2. "YOU SMASHED OUR MAILBOX! MY DAD'S GONNA FREAK!"
3. "YOU DENTED MY MOM'S CAR! COOL! WAIT, NO!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "SCHOOL'S OUT! GIMME A HARD TACO!"
2. "I SPENT MY ALLOWANCE. MAKE IT COUNT!"
3. "ONE HARD TACO! I GOT EXACTLY ONE DOLLAR!"

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "BRO, MY BOARD HAS MORE PURPOSE THAN THIS KITCHEN!"
2. "THIS IS TAKING LONGER THAN SCHOOL!"
3. "I'M GONNA MISS CARTOONS! HURRY UP!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I'M SO HUNGRY MY TUMMY'S YELLING AT ME!"
2. "THIS LINE'S LONGER THAN THE ONE FOR THE SLIDE!"
3. "COME ON! I'M SHORT, NOBODY CAN EVEN SEE ME!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "WITH GREAT POWER COMES GREAT TACOS - AND YOU'RE FAILING ME!"
2. "EW! THAT'S NOT WHAT I SAID! GROSS!"
3. "NO WAY! THAT'S WRONG! ARE YOU EVEN A COOK?"

#### Served

Kitchen Shift: a ticket was served.

1. "YOU'RE THE BEST COOK IN THE WORLD!"
2. "MY BOARD SALUTES YOU. SO DO I."
3. "AWESOME! THIS IS THE BEST TACO EVER MADE!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "SO FAST! YOU'RE LIKE A NINJA COOK!"
2. "PERFECT! I'M GONNA BE A COOK WHEN I GROW UP!"
3. "BEST DAY OF MY WHOLE LIFE! AGAIN!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "GO CHEW ON A HACKY SACK!"
2. "EAT IT, TACO SHOP. EAT. IT."
3. "FORGET IT! I'M GOING TO THE ARCADE!"

### c90boybandmember



#### Delivered

Delivery Shift: the order arrived in good time.

1. "BRAVO! TAKE A BOW, DELIVERY PERSON!"
2. "THAT LANDING DESERVED JAZZ HANDS!"
3. "RIGHT ON CUE! YOU HIT YOUR MARK, DARLING!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! THAT WAS CHOREOGRAPHY!"
2. "ON THE MAT! I'M PUTTING THAT MOVE IN THE VIDEO!"
3. "BRAVO! ENCORE! THROW ANOTHER ONE!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "LATE? YOU MISSED YOUR ENTRANCE, AMATEUR!"
2. "COLD FOOD! EVEN MY FROSTED TIPS ARE WILTING!"
3. "YOU'RE SLOWER THAN OUR THIRD ALBUM'S SALES!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE SHRUBS?! YOU MISSED YOUR MARK, HACK!"
2. "ON THE ROOF?! THAT'S NOT IN THE BLOCKING!"
3. "THAT TOSS WAS SO FLAT IT NEEDS A VOCAL COACH!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WATCH THE FACE! THE FACE IS ON LUNCHBOXES!"
2. "YOU ALMOST HIT ME! I'M ON TOUR, YOU MANIAC!"
3. "WHOA! I CAN'T DANCE IN A FULL BODY CAST!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY TOUR BUS! THE OTHER FOUR ARE ASLEEP IN THERE!"
2. "YOU DENTED THE LIMO! MY MANAGER WILL END YOU!"
3. "MY CONVERTIBLE! I HAD A PHOTO SHOOT IN THAT!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "CURTAIN'S AT SEVEN! I CANNOT BELT HUNGRY!"
2. "DANCE REHEARSAL IN TEN. FIVE, SIX, SEVEN, EIGHT!"
3. "CHICKEN SOFT TACO. NO ONIONS. I HAVE A MEET-AND-GREET."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "HARK! DOTH THE KITCHEN SLUMBER?!"
2. "I AM RENT, I AM EVITA, I AM UNFED!"
3. "I'M GONNA LAY THE SMACKDOWN ON THIS WHOLE RESTAURANT!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "THIS LINE IS BIGGER THAN OUR LAST CONCERT!"
2. "I'VE SIGNED AUTOGRAPHS FASTER THAN THIS!"
3. "STEP-BALL-CHANGE, PEOPLE! KEEP IT MOVING!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "YOU'RE DOOGIE HOWSER ON A BAD DAY!"
2. "TODAY'S WORD IS FURIOUS! CAN YOU SAY FURIOUS?!"
3. "NO! WRONG NOTE! WRONG KEY! WRONG TACO!"

#### Served

Kitchen Shift: a ticket was served.

1. "TODAY'S WORD IS DELICIOUS! SAY DELICIOUS!"
2. "STANDING OVATION FOR THE KITCHEN!"
3. "PERFECTION! I'M WRITING A BALLAD ABOUT THIS!"

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "SHOWSTOPPER! TAKE A BOW, CHEF! TAKE TWO!"
2. "FLAWLESS! YOU COULD BE OUR SIXTH MEMBER!"
3. "FAST AND PERFECT! THAT'S A TONY, DARLING!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "I'M LEAVING! THIS SHOW CLOSES TONIGHT!"
2. "NO ENCORE FOR YOU! CURTAIN!"
3. "I'VE HAD BETTER SERVICE FROM ROADIES!"

### c90teenmom



#### Delivered

Delivery Shift: the order arrived in good time.

1. "HAILEY, WAVE TO THE NICE DRIVER!"
2. "HOT FOOD, NO SPILLS. YOU'RE A LIFESAVER."
3. "RIGHT ON TIME. HAILEY, DON'T LICK THE BAG."

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "RIGHT ON THE MAT! HAILEY, LOOK! DO IT AGAIN!"
2. "DEAD CENTER. YOU AIM BETTER THAN HER FATHER."
3. "ON THE MAT! FINALLY, A MAN WHO FOLLOWS THROUGH."

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "IT'S COLD AND SHE'S SCREAMING. GREAT. THANKS."
2. "I'VE CHANGED THREE DIAPERS SINCE I CALLED!"
3. "TAKE YOUR TIME, HON. NOT LIKE I HAVE A LIFE."

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE SANDBOX? WELL, NOW IT'S HER LUNCH."
2. "ON THE ROOF?! I CAN'T EVEN REACH THE CEREAL!"
3. "YOU MISSED, YOU DIAPER-BRAINED DINGBAT!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "THERE'S A BABY IN THIS STROLLER, YOU JACKASS!"
2. "SLOW DOWN! I'LL CALL THE COPS AND YOUR MOTHER!"
3. "HEY! WE ARE CROSSING HERE, YOU MANIAC!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY CAR! THE CAR SEAT COST MORE THAN THE CAR!"
2. "YOU HIT MY HATCHBACK! YOU'RE PAYING, BUDDY!"
3. "I HAVE A COUPON FOR A LOT OF THINGS. NOT THIS!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "I HAVE A COUPON AND A COMPLAINT!"
2. "NAPTIME'S AT ONE. WE ARE ON A CLOCK."
3. "THE STROLLER'S IN THE DOORWAY. HURRY, HON."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "MY MILK HAS EXPIRED IN MY CART!"
2. "WELL, THIS IS JUST SOMETHING, ISN'T IT?"
3. "HAILEY, GET DOWN FROM THERE! AND SIR, WHERE IS MY ORDER?!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I COULD'VE RAISED A CHILD TO TACO-MAKING AGE BY NOW!"
2. "SHE'S TEETHING AND THIS LINE IS NOT MOVING."
3. "I GOT A BABY ON MY HIP AND A LINE OUT THE DOOR!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "DON'T MAKE ME COME BACK THERE, MISTER."
2. "WRONG. AND I DON'T HAVE TIME FOR WRONG."
3. "THAT'S NOT IT, HON. I CAN READ A TICKET."

#### Served

Kitchen Shift: a ticket was served.

1. "WELL, ISN'T THAT JUST SOMETHING. THANKS!"
2. "HAILEY, SAY THANK YOU. SHE SAYS THANKS."
3. "FINALLY. HAILEY, LOOK, IT'S RIGHT."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FAST AND PERFECT! WANT TO BABYSIT? I PAY IN TACOS."
2. "WELL! SOMEBODY IN THIS TOWN DOES THEIR JOB!"
3. "PERFECT! HAILEY, THAT'S WHAT RELIABLE LOOKS LIKE."

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "COME ON, HAILEY. WE'RE GOING TO SONIC."
2. "I'M LEAVING. AND I'M TAKING MY COUPON."
3. "FORGET IT. I'LL MAKE MAC AND CHEESE. AGAIN."

### c90videoclerk



#### Delivered

Delivery Shift: the order arrived in good time.

1. "RETURNED ON TIME! NO LATE FEE FOR YOU!"
2. "THAT TOSS HAD A BIG FINISH. ROLL CREDITS!"
3. "ON TIME! YOU EARNED A FREE RENTAL, DRIVER!"

#### Perfect

Delivery Shift: the toss landed dead centre on the mat.

1. "DEAD CENTER! I'D PAUSE AND REWIND THAT!"
2. "ON THE MAT! THAT'S A SLOW-MO REPLAY MOMENT!"
3. "BULLSEYE! THAT TOSS GETS ITS OWN SEQUEL!"

#### Late

Delivery Shift: it arrived, but the tip had run down.

1. "YOU MAKE ENCINO MAN LOOK QUICK!"
2. "ACT NOW AND YOU MIGHT GET YOUR TACO IN THIS LIFETIME!"
3. "LATE? THAT'S A FIVE DOLLAR LATE FEE, PAL!"

#### Missed

Delivery Shift: the bag landed off the porch.

1. "IN THE BUSHES? THAT'S STRAIGHT TO VIDEO!"
2. "THE ROOF? WORST STUNT DOUBLE EVER!"
3. "YOU MISSED. THAT'S A BLOOPER REEL, YOU HACK!"

#### Nearmiss

Delivery Shift: a passer-by the car nearly ran down.

1. "WHOA! THIS ISN'T A CAR CHASE MOVIE, IDIOT!"
2. "SLOW DOWN! I'M NOT AN EXTRA, YOU CLOWN!"
3. "YOU ALMOST HIT ME! I HAVE FOUR TAPES DUE!"

#### Fender

Delivery Shift: the driver of a car the player crunched.

1. "MY HATCHBACK! YOU'RE RATED R FOR RECKLESS!"
2. "YOU HIT MY CAR! YOU'RE BANNED FROM THE STORE!"
3. "THAT DENT'S GONNA COST YOU WAY MORE THAN LATE FEES!"

#### Arrive

Kitchen Shift: a new ticket goes on the rail.

1. "NEW RELEASES DUE BACK AT SIX. HURRY!"
2. "I'M ON BREAK. TWENTY MINUTES. GO!"
3. "SOFT TACO. I'VE GOT TWELVE TAPES TO REWIND."

#### Wait

Kitchen Shift: a customer's patience is under 30%.

1. "I'M ON MY LUNCH BREAK, YA MORON!"
2. "I AM VENGEANCE. I AM THE NIGHT. I AM... STILL WAITING FOR A TACO."
3. "I'VE WATCHED WHOLE TRILOGIES FASTER THAN THIS!"

#### Queue

Kitchen Shift: the line is past three customers.

1. "I'M HERE ALL DAY WAITING FOR THIS MEAL!"
2. "THIS LINE IS LONGER THAN THE DIRECTOR'S CUT!"
3. "IT'S LIKE FRIDAY NIGHT AT THE NEW RELEASE WALL!"

#### Wrong

Kitchen Shift: a wrong pick.

1. "WRONG! THAT'S THE WRONG TAPE IN THE CASE!"
2. "THAT'S NOT WHAT I ORDERED! CUT! TAKE TWO!"
3. "WRONG GENRE, PAL. I ORDERED CHICKEN."

#### Served

Kitchen Shift: a ticket was served.

1. "STAFF PICK OF THE WEEK. NO QUESTION."
2. "I'D RENT THIS TACO AGAIN. TWICE."
3. "NOW THAT'S A BLOCKBUSTER."

#### Nailed

Kitchen Shift: a clean ticket, served fast.

1. "FAST AND PERFECT! FIVE STARS, NO CUTS!"
2. "THAT TICKET WAS OSCAR-WORTHY, COOK!"
3. "FLAWLESS! I'D PUT YOU ON THE BOX ART!"

#### Walkout

Kitchen Shift: a customer's patience ran out.

1. "ROLL CREDITS. I'M GONE."
2. "WORST SEQUEL YET. I'M WALKING OUT."
3. "BE BACK NEVER. NO RETURNS, NO REFUNDS."
